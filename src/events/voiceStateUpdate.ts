import { VoiceState } from 'discord.js';
import { NovatoManager } from '../managers/NovatoManager';

const novatoManager = NovatoManager.getInstance();

export const handleVoiceStateUpdate = async (oldState: VoiceState, newState: VoiceState) => {
    // Check if user is a bot
    if (newState.member?.user.bot) return;

    // Check if user joined a channel (newState.channelId is not null)
    if (!newState.channelId) return;

    // Optional: Ignore if just muting/deafening (channelId same as oldState)
    if (oldState.channelId === newState.channelId) return;

    const memberId = newState.member?.id;
    if (!memberId) return;

    const novato = await novatoManager.getNovato(memberId);
    if (!novato) return;

    const channelName = newState.channel?.name || newState.channelId;

    // 1. Register Visit
    await novatoManager.registerChannelVisit(memberId, channelName);

    // 2. Register Interaction (Risk Reduction)
    await novatoManager.addInteraction(memberId, 'voice_join');

    console.log(`[Voice] ${novato.nome} joined ${channelName}`);
};
