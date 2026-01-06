import { Client, TextChannel } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';
import { EmbedRenderer } from './EmbedRenderer';
import { config } from '../config';
import { Novato } from '../types';

import { LocalTextEnhancer } from './LocalTextEnhancer';
import { VerificationEngine } from './VerificationEngine';
import { EngagementRules } from './EngagementRules';

export class EngagementQueue {
    private client: Client;
    private manager: NovatoManager;
    private embedRenderer: EmbedRenderer;
    private localEnhancer: LocalTextEnhancer;
    private intervalId: NodeJS.Timeout | null = null;
    private isProcessing: boolean = false;

    constructor(client: Client) {
        this.client = client;
        this.manager = NovatoManager.getInstance();
        this.embedRenderer = new EmbedRenderer(client);
        this.localEnhancer = new LocalTextEnhancer();
    }

    start(intervalMs: number = 60000) {
        if (this.intervalId) return;
        // console.log("Engagement Queue started (Deterministic Mode).");

        // Immediate check for feedback
        // console.log("Running initial queue check immediately...");
        this.processQueue();

        this.intervalId = setInterval(() => this.processQueue(), intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async processQueue() {
        if (this.isProcessing) {
            // console.log("[DEBUG Queue] Already processing. Skipping cycle.");
            return;
        }
        this.isProcessing = true;

        // console.log("[DEBUG Queue] Interval triggered. Processing queue...");

        try {
            const novatos = await this.manager.getAllNovatos();
            // console.log(`[DEBUG Queue] Total Novatos Loaded: ${novatos.length}`);

            const guild = this.client.guilds.cache.get(config.guildId);
            // Forced name as requested
            const serverName = "Pureza";

            // Only check users who haven't been engaged yet
            const candidates = novatos.filter(n => !n.mensagem_enviada);
            // console.log(`[DEBUG Queue] Starting process. Candidates (not notified): ${candidates.length}`);

            const batchSize = config.settings?.batchSize || 5;
            const batch = candidates.slice(0, batchSize);

            let successful = 0;

            for (const rawNovato of batch) {
                // console.log(`[DEBUG Queue] Processing candidate: ${rawNovato.nome || rawNovato.id}`);

                // 1. Deterministic Verification
                const validation = VerificationEngine.validate(rawNovato);
                if (!validation.isValid) {
                    console.warn(`Validation failed for ${rawNovato.id}:`, validation.issues);
                    continue;
                }
                const novato = validation.safeNovato;

                // 2. Deterministic Rules (Business Logic)
                const decision = EngagementRules.evaluate(novato);
                // console.log(`[DEBUG Queue] Decision for ${novato.nome}: ${decision.shouldEngage ? 'ENGAGE' : 'SKIP'} (${decision.reason})`);

                if (decision.shouldEngage) {
                    // console.log(`Engaging ${novato.nome}...`);

                    // 3. Local Smart Templates (Deterministic & Free)
                    const enhancedContent = this.localEnhancer.enhance(
                        novato,
                        serverName,
                        decision.reason
                    );

                    // 4. Render & Send
                    await this.engageNovato(novato, enhancedContent);
                    successful++;

                    // Small delay just to not flood Discord API
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (batch.length > 0 && successful > 0) {
                // console.log(`Processed batch of ${batch.length}. Engaged: ${successful}`);
            }

        } catch (error) {
            console.error("Error processing Engagement Queue:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async engageNovato(novato: Novato, content: any) {
        try {
            // Render using Strict Renderer
            const { embed, components } = await this.embedRenderer.render(novato, content);

            // Attempt DM first
            try {
                const user = await this.client.users.fetch(novato.id);
                const dm = await user.createDM();
                await dm.send({ embeds: [embed], components });

                await this.manager.updateNovato(novato.id, {
                    mensagem_enviada: true,
                    alertas_staff: [...novato.alertas_staff, "Engagement DM Sent"]
                });

                try {
                    // Public Notification (Tag User)
                    const publicChannelId = config.channels.chat_geral_1;
                    const publicChannel = this.client.channels.cache.get(publicChannelId) as TextChannel;

                    if (publicChannel) {
                        // Using a simple, friendly message
                        await publicChannel.send({
                            content: `Ei <@${novato.id}>, acabei de enviar uma mensagem na sua **DM**! Dá uma olhada lá. 📬`
                        });
                    }
                } catch (pubError) {
                    console.error(`Failed to send public ping for ${novato.id}`, pubError);
                    // Non-critical, continue
                }

            } catch (dmError) {
                console.log(`Could not DM ${novato.nome}. User might have DMs closed.`);

                // Fallback Log
                if (config.channels.staffLog) {
                    const channel = this.client.channels.cache.get(config.channels.staffLog) as TextChannel;
                    if (channel) {
                        const { EmbedBuilder } = require('discord.js');
                        const logEmbed = new EmbedBuilder()
                            .setTitle('⚠️ Falha de Engajamento')
                            .setDescription(`O sistema tentou engajar um novato, mas falhou ao enviar a DM.`)
                            .setColor('#ff9900')
                            .addFields(
                                { name: '👤 Novato', value: `<@${novato.id}> \`${novato.nome}\``, inline: true },
                                { name: '🔴 Motivo', value: 'DMs provavelmente fechadas', inline: true },
                                { name: '🔧 Ação Recomendada', value: 'Verificar se o usuário está ativo nos canais públicos.', inline: false }
                            )
                            .setFooter({ text: "Pureza • Sistema de Engajamento", iconURL: this.client.user?.displayAvatarURL() })
                            .setTimestamp();

                        channel.send({ embeds: [logEmbed] });
                    }
                }

                await this.manager.updateNovato(novato.id, {
                    mensagem_enviada: true,
                    alertas_staff: [...novato.alertas_staff, "Engagement Failed (DMs Closed)"]
                });
            }

        } catch (error) {
            console.error(`Failed to engage novato ${novato.id}`, error);
        }
    }
}
