import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../config';

const commands = [
    new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Exibe o dashboard de métricas dos novatos (Staff Only)')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('painel-novatos')
        .setDescription('🧠 Painel de Controle de Engajamento (Admin Only)')
        .setDefaultMemberPermissions(0x8) // Administrator
        .toJSON(),
];

if (!config.token || !config.clientId || !config.guildId) {
    console.error("Missing credentials in .env (DISCORD_TOKEN, CLIENT_ID, GUILD_ID)");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
