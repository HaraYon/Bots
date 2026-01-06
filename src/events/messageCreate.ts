import { Message, ChannelType } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';
import { RiskScore } from '../analytics/RiskScore';
import { StatsManager } from '../managers/StatsManager';
import { generateDashboard } from '../utils/dashboard';
import { config } from '../config';

const novatoManager = NovatoManager.getInstance();

export const handleMessageCreate = async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    // Simple command handler for dashboard
    if (message.content === '!dashboard') {
        if (message.channel.type === ChannelType.GuildText) {
            try {
                const stats = new StatsManager();
                const { embed, components } = await generateDashboard(stats);
                await message.channel.send({ embeds: [embed], components });
            } catch (e) {
                console.error("Dashboard command failed", e);
                await message.channel.send("Erro ao gerar dashboard.");
            }
        }
        return;
    }

    const novato = await novatoManager.getNovato(message.author.id);
    if (!novato) return;

    // Update channels visited
    let channelName = message.channelId; // Default to ID
    if ('name' in message.channel && typeof message.channel.name === 'string') {
        channelName = message.channel.name;
    }

    if (!novato.canais_visitados.includes(channelName)) {
        novato.canais_visitados.push(channelName);
    }

    // Calculate new score
    const newScore = RiskScore.onInteraction(novato.score_risco, 'message');

    // Update Novato
    await novatoManager.updateNovato(novato.id, {
        canais_visitados: novato.canais_visitados,
        score_risco: newScore
    });

    // Log interaction
    await novatoManager.addInteraction(novato.id, 'mensagem');
};
