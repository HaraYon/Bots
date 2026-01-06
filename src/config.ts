import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

export const config = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    channels: {
        staffLog: process.env.CHANNEL_STAFF_LOG || '',
        seja_pureza: "1176850092620251146",
        chat_geral_1: "1434311416524968058",
        chat_geral_2: "1434312692503416842"
    },
    emojis: {
        purpleHeart: "<a:download:1457795838356099092>",
        moonStars: "<a:Postbycheriisoda19images:1457795780545876176>"
    },
    thresholds: {
        highRisk: 70,
        mediumRisk: 40,
    },
    settings: {
        batchSize: 5,
        cacheTTL: 60 * 10 * 1000, // 10 minutes
    },
    roles: {
        // Removed Novato role requirement
    },
    paths: {
        data: path.resolve(process.cwd(), 'data', 'novatos')
    }
};
