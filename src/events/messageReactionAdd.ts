import { MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';

const novatoManager = NovatoManager.getInstance();

export const handleMessageReactionAdd = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.bot) return;

    // Resolve partials if necessary (often needed for reactions on old messages)
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    if (user.partial) {
        try {
            await user.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the user:', error);
            return;
        }
    }

    const memberId = user.id;
    const novato = await novatoManager.getNovato(memberId);
    if (!novato) return;

    // Get channel name
    let channelName = reaction.message.channelId;
    // Check if channel has a name property (TextChannel, etc.)
    const channel = reaction.message.channel;
    if ('name' in channel && typeof channel.name === 'string') {
        channelName = channel.name;
    }

    // 1. Register Visit
    await novatoManager.registerChannelVisit(memberId, channelName);

    // 2. Register Interaction
    await novatoManager.addInteraction(memberId, 'reaction');

    // Low usage log
    // console.log(`[Reaction] ${novato.nome} reacted in ${channelName}`);
};
