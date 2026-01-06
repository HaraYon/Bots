import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { StatsManager } from '../managers/StatsManager';
import { config } from '../config';

export async function generateDashboard(statsManager: StatsManager) {
    const stats = await statsManager.getGlobalStats();
    const recentInteractions = await statsManager.getRecentInteractions(1);

    // =====================
    // Data Preparation
    // =====================

    const total = stats.totalNovatos;

    const engagementRate =
        total > 0 && stats.botoesClicados > 0
            ? `${((stats.botoesClicados / total) * 100).toFixed(1)}%`
            : null;

    const isInitialized = total > 0;

    // =====================
    // System Overview
    // =====================

    const systemOverview = isInitialized
        ? [
            `Novatos monitorados: ${total}`,
            `Engajamento médio: ${engagementRate ?? 'Coletando dados'}`,
            `Estado do sistema: Operacional`
        ].join('\n')
        : [
            `Sistema em inicialização.`,
            `Aguardando coleta de dados.`
        ].join('\n');

    // =====================
    // Risk Distribution
    // =====================

    const riskDistribution = [
        `Alto risco: ${stats.riscoAlto}`,
        `Atenção: ${stats.riscoMedio}`,
        `Saudáveis: ${stats.riscoBaixo}`
    ].join('\n');

    // =====================
    // Priority Actions (conditional)
    // =====================

    const priorityLines: string[] = [];

    if (stats.riscoAlto > 0) {
        priorityLines.push(`${stats.riscoAlto} novatos requerem estímulo imediato.`);
    }

    if (stats.active24h > 0) {
        priorityLines.push(`${stats.active24h} novatos apresentaram atividade recente.`);
    }

    const hasPriorityActions = priorityLines.length > 0;

    // =====================
    // Recent Activity
    // =====================

    let lastInteraction = 'Nenhuma interação registrada';

    if (recentInteractions.length > 0) {
        const timestamp = Math.floor(
            new Date(recentInteractions[0].time).getTime() / 1000
        );
        lastInteraction = `<t:${timestamp}:R>`;
    }

    const recentActivity = [
        `Última interação registrada: ${lastInteraction}`,
        `Canais monitorados: Texto, Voz, Reações`
    ].join('\n');

    // =====================
    // Embed Assembly
    // =====================

    // =====================
    // Embed Assembly
    // =====================

    const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.moonStars} Pureza • Painel de Monitoramento`)
        .setDescription(`Resumo operacional do engajamento e estado atual dos novatos. ${config.emojis.purpleHeart}`)
        .setColor('#4400ff')
        .addFields(
            // Top Grid (KPIs)
            {
                name: '👥 Novatos',
                value: `\`${total}\``,
                inline: true
            },
            {
                name: '📈 Taxa de Retenção',
                value: `\`${engagementRate ?? '...'}\``,
                inline: true
            },
            {
                name: '🔋 Status Operacional',
                value: `\`Online\``,
                inline: true
            },

            // Risk Distribution (Horizontal, Clean)
            {
                name: '⚖️ Distribuição de Risco',
                value: `Alto: **${stats.riscoAlto}** • Médio: **${stats.riscoMedio}** • Baixo: **${stats.riscoBaixo}**`,
                inline: false
            }
        );

    if (hasPriorityActions) {
        embed.addFields({
            name: '⚠️ Ações Relevantes',
            value: priorityLines.join('\n'),
            inline: false
        });
    }

    embed.addFields({
        name: '📡 Atividade Recente',
        value: [
            `Última: ${lastInteraction}`,
            `Canais: Texto, Voz, Reações`
        ].join('\n'),
        inline: false
    });

    embed.setFooter({
        text: "Pureza | Amigos・Conversar・Call・Amizade・Brasil・Comunidade・Roblox・Anime・BR・FiveM ©",
        iconURL: "https://cdn.discordapp.com/avatars/1159954895311474689/a_ec3c91ebc08710942acf441c6ffcdd1a.gif"
    })
        .setTimestamp();

    // =====================
    // Controls
    // =====================

    const refreshButton = new ButtonBuilder()
        .setCustomId('dashboard_refresh')
        .setLabel('Atualizar painel')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(refreshButton);

    return { embed, components: [row] };
}