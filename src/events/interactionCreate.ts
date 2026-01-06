import { Interaction } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';
import { RiskScore } from '../analytics/RiskScore';
import { StatsManager } from '../managers/StatsManager';
import { generateDashboard } from '../utils/dashboard';
import { EmbedGenerator } from '../systems/EmbedGenerator';
import { EngagementPanel } from '../systems/EngagementPanel';
import { config } from '../config';

const novatoManager = NovatoManager.getInstance();

export const handleInteractionCreate = async (interaction: Interaction) => {
    // --- Slash Commands ---
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'dashboard') {
            try {
                await interaction.deferReply({ flags: 64 });
                const stats = new StatsManager();
                const { embed, components } = await generateDashboard(stats);
                await interaction.editReply({ embeds: [embed], components });
            } catch (e) {
                console.error("Dashboard command failed", e);
                if (interaction.deferred) await interaction.editReply({ content: 'Erro ao gerar dashboard.' });
            }
        }

        if (commandName === 'painel-novatos') {
            try {
                await interaction.deferReply({ flags: 64 }); // Ephemeral pra ninguém ver
                const { embeds, components } = await EngagementPanel.generatePanel(interaction.client);
                await interaction.editReply({ embeds, components });
            } catch (e) {
                console.error("Panel generation failed", e);
                if (interaction.deferred) await interaction.editReply({ content: 'Deu ruim ao gerar o painel.' });
            }
        }
        return;
    }

    // --- Botões ---
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    // Lógica do Painel
    if (customId.startsWith('panel_')) {
        await EngagementPanel.handleInteraction(interaction);
        return;
    }

    // Dashboard Refresh Logic
    if (customId === 'dashboard_refresh') {
        try {
            await interaction.deferUpdate();
            const stats = new StatsManager();
            const { embed, components } = await generateDashboard(stats);
            await interaction.editReply({ embeds: [embed], components });
        } catch (e) {
            console.error("Dashboard refresh failed", e);
        }
        return;
    }

    // Handle Novato Actions
    if (customId.startsWith('novato_action:')) {
        const parts = customId.split(':');
        const action = parts[1];

        try {
            const novato = await novatoManager.getNovato(interaction.user.id);

            if (novato) {
                const newScore = RiskScore.onInteraction(novato.score_risco, 'button_click');

                await novatoManager.updateNovato(novato.id, {
                    clicou_botao: true,
                    score_risco: newScore
                });

                await novatoManager.addInteraction(novato.id, `clicou_botao:${action}`);
            }

            // Resposta Passiva e Convidativa
            await interaction.reply({
                content: `🎉 **Que bom ter você por perto!**\n\nBora conversar? Clique aqui: <#${config.channels.chat_geral_1}>\n\nQualquer dúvida, a staff está à disposição.`,
                flags: 64
            });

        } catch (error) {
            console.error(`Error handling interaction for ${interaction.user.id}`, error);
            if (!interaction.replied) await interaction.reply({ content: 'Erro ao processar.', flags: 64 });
        }
    }
};
