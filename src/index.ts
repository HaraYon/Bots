import { Client, GatewayIntentBits, Interaction, Events } from 'discord.js';
import { config } from './config';
import { handleGuildMemberAdd } from './events/guildMemberAdd';
import { handleMessageCreate } from './events/messageCreate';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate';
import { handleMessageReactionAdd } from './events/messageReactionAdd';
import { handleInteractionCreate } from './events/interactionCreate';
import { EngagementQueue } from './systems/EngagementQueue';
import { PanelManager } from './managers/PanelManager';
import { NovatoManager } from './managers/NovatoManager';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.on(Events.ClientReady, async () => {
    console.log(`Bot logged in as ${client.user?.tag}`);

    // Start the engagement queue loop
    const queue = new EngagementQueue(client);
    queue.start();

    // Initialize Panel State
    await PanelManager.getInstance().initialize();

    // Initialize Novato Data
    await NovatoManager.getInstance().initialize();
});

client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('messageCreate', handleMessageCreate);
client.on('voiceStateUpdate', handleVoiceStateUpdate);
client.on('messageReactionAdd', handleMessageReactionAdd);

// Placeholder for separate interaction handler file or inline for now if simple
// We'll separate it to keep it clean.
client.on('interactionCreate', async (interaction) => {
    // Standard import usage since we are in the same project source
    await handleInteractionCreate(interaction);
});

client.login(config.token);
