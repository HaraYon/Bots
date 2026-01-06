import { GuildMember, TextChannel } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';
import { config } from '../config';

const novatoManager = NovatoManager.getInstance();

const processing = new Set<string>();

export const handleGuildMemberAdd = async (member: GuildMember) => {
    if (member.user.bot) return;

    // Concurrency Guard: Ignore if already processing this user
    if (processing.has(member.id)) {
        console.log(`Duplicate event for ${member.user.tag} ignored.`);
        return;
    }

    processing.add(member.id);

    console.log(`Analyzing member: ${member.user.tag} (${member.id})`);

    try {
        const result = await novatoManager.checkAndHandleJoin(member.id, member.user.username);

        if (result.status === 'RETURNING_IGNORED') {
            console.log(`Member ${member.user.tag} returned but is already safe/verified. Ignoring.`);
            return;
        }

        if (result.status === 'RETURNING_TRACKED') {
            console.log(`Member ${member.user.tag} returned and is flagged for re-engagement.`);
        }

        if (result.status === 'NEW') {
            console.log(`New member detected and tracked: ${member.user.tag}`);
        }

        // Log to Staff Channel
        if (config.channels.staffLog) {
            const channel = member.guild.channels.cache.get(config.channels.staffLog) as TextChannel;
            if (channel) {
                if (result.status === 'RETURNING_TRACKED') {
                    channel.send(`👁️ Usuário recorrente detectado\n<@${member.id}> — Score: ${result.novato.score_risco}`);
                } else {
                    channel.send(`✨ Novo usuário detectado\n<@${member.id}> — Score: ${result.novato.score_risco}`);
                }
            }
        }

    } catch (error) {
        console.error(`Error handling member add for ${member.id}:`, error);
    } finally {
        // Always clear the lock
        processing.delete(member.id);
    }
};
