import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Guild } from 'discord.js';
import { Novato, EmbedPersonalizada, EngagementContent } from '../types';
import { config } from '../config';

export class EmbedRenderer {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    private getGuild(): Guild | undefined {
        return this.client.guilds.cache.get(config.guildId);
    }

    private replacePlaceholders(text: string, novato: Novato, guild: Guild): string {
        return text
            .replace(/{nome}/g, novato.nome)
            .replace(/{id}/g, novato.id)
            .replace(/{servidor}/g, guild.name);
    }

    /**
     * Renders the engagement embed using Validated Data + Content.
     * ZERO business logic here.
     */
    async render(novato: Novato, content?: EngagementContent): Promise<{ embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] }> {
        const guild = this.getGuild();
        if (!guild) throw new Error("Guild not found during render");

        // Fallback Content
        const baseTitle = content?.title || `Olá, {nome}!`;
        const baseDescription = content?.description || `Vimos que você chegou recentemente no **{servidor}**. Esperamos que esteja curtindo!\n\nSe estiver procurando onde interagir, nosso <#${config.channels.chat_geral_1}> ou <#${config.channels.chat_geral_2}> são ótimos começos.`;

        const emojis = content?.emojis || [];
        const emojiTitle = emojis[0] || config.emojis.moonStars;
        const emojiDesc = emojis[1] || config.emojis.purpleHeart;

        // Template Construction
        const template: EmbedPersonalizada = {
            titulo: `${emojiTitle} ${baseTitle}`,
            descricao: `${baseDescription} ${emojiDesc}`,
            imagem_banner: "https://media.discordapp.net/attachments/1427405550328483992/1431408917262373026/barr3_1.gif?ex=695d8c70&is=695c3af0&hm=5431b2376fbeb9d06507cbdec8d5fa6f94c3faa18e9b1ca52e5ee25bd95381dd&=",
            footer: "Fique à vontade para explorar.",
            emojis: [],
            botao: {
                label: content?.cta || "🗺️ Dicas de Onde Começar",
                acao: "show_tips"
            }
        };

        const description = this.replacePlaceholders(template.descricao, novato, guild);
        const title = this.replacePlaceholders(template.titulo, novato, guild);

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#4400ff') // Premium Blue/Purple
            .setImage(template.imagem_banner)
            .setThumbnail("https://media.discordapp.net/attachments/1212494029707804682/1334603845346525274/przz.gif?ex=695cb770&is=695b65f0&hm=d1f95fe6686625280ef66c951239be9078fb276fd6de768d2bdcf9b255a323fe&=")
            .setFooter({
                text: "Pureza | Amigos・Conversar・Call・Amizade・Brasil・Comunidade・Roblox・Anime・BR・FiveM ©",
                iconURL: "https://cdn.discordapp.com/avatars/1159954895311474689/a_ec3c91ebc08710942acf441c6ffcdd1a.gif"
            })
            .setTimestamp();

        // Consistency Check: Always add the tip field if it's the default/fallback message
        if (!content) {
            embed.addFields({ name: '✨ Dica Rápida', value: '> Puxe assunto no chat geral ou veja nossos eventos!', inline: false });
        }

        const button = new ButtonBuilder()
            .setCustomId(`novato_action:${template.botao.acao}:${novato.id}`)
            .setLabel(template.botao.label)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💬');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        return { embed, components: [row] };
    }
}
