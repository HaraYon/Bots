import fs from 'fs/promises';
import path from 'path';
import { Novato, NovatoInteraction } from '../types';
import { RiskScore } from '../analytics/RiskScore';
import { VerificationEngine } from '../systems/VerificationEngine';
import { config } from '../config';

export class NovatoManager {
    private static instance: NovatoManager;
    private dataDir: string;
    private cache: Map<string, Novato>;
    private initialized: boolean = false;

    private constructor() {
        this.dataDir = config.paths.data;
        this.cache = new Map();
    }

    public static getInstance(): NovatoManager {
        if (!NovatoManager.instance) {
            NovatoManager.instance = new NovatoManager();
        }
        return NovatoManager.instance;
    }

    /**
     * Loads all data from disk into memory.
     * MUST be called at bot startup.
     */
    async initialize() {
        if (this.initialized) return;
        console.log("Loading Novatos into Memory...");
        try {

            // Ensure directory exists
            try {
                await fs.access(this.dataDir);
            } catch {
                console.log(`Creating data directory: ${this.dataDir}`);
                await fs.mkdir(this.dataDir, { recursive: true });
            }

            let files: string[] = [];
            try {
                files = await fs.readdir(this.dataDir);
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    console.warn(`Data directory not found after creation attempt: ${this.dataDir}`);
                    files = [];
                } else {
                    throw err;
                }
            }

            let loaded = 0;
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                if (file.startsWith('test-user') || file.startsWith('sim-')) continue; // Ignore test artifacts

                try {
                    const data = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
                    const raw = JSON.parse(data);
                    const validation = VerificationEngine.validate(raw);
                    if (validation.isValid) {
                        this.cache.set(validation.safeNovato.id, validation.safeNovato);
                        loaded++;
                    }
                } catch (e) {
                    console.error(`Failed to load ${file}`, e);
                }
            }
            this.initialized = true;
            console.log(`✅ Loaded ${loaded} novatos into RAM.`);
        } catch (error) {
            console.error("Failed to initialize NovatoManager", error);
        }
    }

    private getFilePath(id: string): string {
        return path.join(this.dataDir, `${id}.json`);
    }

    // --- Core Operations (Memory First) ---

    async checkAndHandleJoin(memberId: string, username: string): Promise<{ novato: Novato, status: 'NEW' | 'RETURNING_IGNORED' | 'RETURNING_TRACKED' }> {
        const existing = await this.getNovato(memberId);

        if (existing) {
            if (existing.score_risco < config.thresholds.mediumRisk) {
                return { novato: existing, status: 'RETURNING_IGNORED' };
            }
            existing.entrada = new Date().toISOString();
            await this.saveNovato(existing);
            return { novato: existing, status: 'RETURNING_TRACKED' };
        }

        const novato = await this.createNovato(memberId, username);
        return { novato, status: 'NEW' };
    }

    async createNovato(memberId: string, username: string): Promise<Novato> {
        const now = new Date().toISOString();
        const novato: Novato = {
            id: memberId,
            nome: username,
            entrada: now,
            canais_visitados: [],
            score_risco: 100,
            mensagem_enviada: false,
            clicou_botao: false,
            badge: null,
            interacoes: [],
            alertas_staff: [],
            ultimo_update: now,
        };

        await this.saveNovato(novato);
        return novato;
    }

    async getNovato(id: string): Promise<Novato | null> {
        // 1. RAM (O(1))
        if (this.cache.has(id)) {
            return this.cache.get(id)!;
        }

        // 2. Fallback to Disk (In case file added externally)
        // Only if initialized to avoid race conditions during verify scripts that might not init
        try {
            const data = await fs.readFile(this.getFilePath(id), 'utf-8');
            const raw = JSON.parse(data);
            const validation = VerificationEngine.validate(raw);
            if (validation.isValid) {
                this.cache.set(validation.safeNovato.id, validation.safeNovato);
                return validation.safeNovato;
            }
        } catch (e) {
            // Not found
        }
        return null;
    }

    async saveNovato(novato: Novato): Promise<void> {
        novato.ultimo_update = new Date().toISOString();

        // 1. Update RAM (Instant)
        this.cache.set(novato.id, novato);

        // 2. Persist to Disk (Async/Fire & Forget safe, but we await to ensure integrity in this flow)
        const filePath = this.getFilePath(novato.id);
        const tempPath = `${filePath}.tmp`;

        try {
            await fs.writeFile(tempPath, JSON.stringify(novato, null, 2));
            await fs.rename(tempPath, filePath);
        } catch (e) {
            console.error(`Failed to save novato ${novato.id} to disk`, e);
        }
    }

    async updateNovato(id: string, updates: Partial<Novato>): Promise<Novato | null> {
        const novato = await this.getNovato(id);
        if (!novato) return null;

        const updatedNovato = { ...novato, ...updates };
        await this.saveNovato(updatedNovato);
        return updatedNovato;
    }

    async addInteraction(id: string, action: string): Promise<Novato | null> {
        const novato = await this.getNovato(id);
        if (!novato) return null;

        novato.interacoes.push({
            acao: action,
            timestamp: new Date().toISOString()
        });

        const newScore = RiskScore.onInteraction(novato.score_risco, action);
        novato.score_risco = newScore;

        await this.saveNovato(novato);
        return novato;
    }

    async registerChannelVisit(id: string, channelName: string): Promise<Novato | null> {
        const novato = await this.getNovato(id);
        if (!novato) return null;

        if (!novato.canais_visitados.includes(channelName)) {
            novato.canais_visitados.push(channelName);
            await this.saveNovato(novato);
        }
        return novato;
    }

    /**
     * Returns all novatos from MEMORY. O(N) but N is in RAM.
     * Extremely fast compared to reading files.
     */
    async getAllNovatos(): Promise<Novato[]> {
        // If not initialized, try to load? Or assumes initialized.
        // Better safe:
        if (!this.initialized) await this.initialize();
        return Array.from(this.cache.values());
    }
}
