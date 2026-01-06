import { Novato } from '../types';

export interface ValidationResult {
    isValid: boolean;
    safeNovato: Novato;
    issues: string[];
}

export class VerificationEngine {

    /**
     * Validates and Sanitizes a Novato object.
     * Ensures all fields are present and valid types.
     * Returns a "Safe" version of the object with defaults applied if necessary.
     */
    static validate(data: any): ValidationResult {
        const issues: string[] = [];
        let isValid = true;

        // 1. Basic Identity
        if (!data.id || typeof data.id !== 'string') {
            issues.push("Missing or invalid ID");
            isValid = false;
            // ID is critical, cannot auto-fix easily without context, but we proceed regarding fields
        }

        const safeNovato: Novato = {
            id: data.id || "unknown_id",
            nome: data.nome || "Unknown User",
            entrada: this.validateDate(data.entrada) ? data.entrada : new Date().toISOString(),
            // Arrays: Ensure Unique and Array Type
            canais_visitados: Array.isArray(data.canais_visitados)
                ? [...new Set((data.canais_visitados as any[]).filter((c: any) => typeof c === 'string'))]
                : [],

            interacoes: Array.isArray(data.interacoes)
                ? data.interacoes.filter((i: any) => i && i.acao && i.timestamp)
                : [],

            score_risco: typeof data.score_risco === 'number' ? data.score_risco : 100,

            // Booleans
            mensagem_enviada: !!data.mensagem_enviada,
            clicou_botao: !!data.clicou_botao,

            // Nullables
            badge: data.badge || null,
            alertas_staff: Array.isArray(data.alertas_staff) ? data.alertas_staff : [],

            ultimo_update: this.validateDate(data.ultimo_update) ? data.ultimo_update : new Date().toISOString()
        };

        // Report fixes as issues for log
        if (!Array.isArray(data.canais_visitados)) issues.push("canais_visitados fixed (was not array)");
        if (new Set(data.canais_visitados).size !== (data.canais_visitados?.length || 0)) issues.push("canais_visitados fixed (duplicates removed)");
        if (safeNovato.score_risco < 0 || safeNovato.score_risco > 100) {
            safeNovato.score_risco = Math.max(0, Math.min(100, safeNovato.score_risco));
            issues.push("score_risco clamped to 0-100");
        }

        return {
            isValid, // Valid means "Critical Identifiers present"
            safeNovato,
            issues
        };
    }

    private static validateDate(dateStr: any): boolean {
        if (!dateStr || typeof dateStr !== 'string') return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime());
    }
}
