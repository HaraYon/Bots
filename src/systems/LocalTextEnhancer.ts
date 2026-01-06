import { Novato, EngagementContent } from '../types';
import { config } from '../config';

interface Template {
    title: string;
    description: string;
    cta: string;
    emojis: string[];
    tone: string;
}

export class LocalTextEnhancer {

    // Dictionary of templates
    private templates: Record<string, Template[]> = {
        'RETENTION': [
            {
                title: "Sentimos sua falta!",
                description: "Faz um tempinho que não te vemos por aqui na **{servidor}**. Tá tudo bem? Se precisar de ajuda ou só quiser bater papo, estamos por aqui.",
                cta: "Voltar para o Chat",
                emojis: ["👋", "💜"],
                tone: "Warm"
            },
            {
                title: "O chat está bombando!",
                description: "Ei {nome}, várias conversas legais rolando agora na **{servidor}**. Que tal dar uma passada para dar um oi?",
                cta: "Ir para o Chat",
                emojis: ["🔥", "💬"],
                tone: "Excited"
            }
        ],
        'ENCOURAGEMENT': [
            {
                title: "Vimos você por aí!",
                description: "Que legal ver você explorando os canais! Se quiser se enturmar mais, o chat geral é o melhor lugar.",
                cta: "Mandar um Oi",
                emojis: ["👀", "✨"],
                tone: "Friendly"
            },
            {
                title: "Curtiu a call?",
                description: "Vi que você passou pelos canais de voz. O pessoal da **{servidor}** adora resenhar por lá. Apareça mais vezes!",
                cta: "Ver Canais de Voz",
                emojis: ["🎙️", "🔊"],
                tone: "Casual"
            }
        ],
        'DEFAULT': [
            {
                title: "Bem-vindo de volta!",
                description: "Esperamos que esteja curtindo a **{servidor}**. Qualquer dúvida, pode chamar a gente.",
                cta: "Explorar",
                emojis: ["👋", "🌟"],
                tone: "Neutral"
            }
        ]
    };

    /**
     * Enhances text using local templates based on decision logic.
     * ZERO external API calls. Instant & Free.
     */
    enhance(novato: Novato, serverName: string, reason: string): EngagementContent {
        // 1. Select Category
        const category = this.templates[reason] ? reason : 'DEFAULT';

        // 2. Select Template (Random for variety, or Hash based on ID for consistency? Random is better for variety)
        // Using Math.random() is fine here as it's "Aesthetic" randomness, not "Logic" randomness.
        const options = this.templates[category];
        const template = options[Math.floor(Math.random() * options.length)];

        // 3. Fill Slots
        const socialChannels = [
            config.channels.chat_geral_1 ? `<#${config.channels.chat_geral_1}>` : '',
            config.channels.chat_geral_2 ? `<#${config.channels.chat_geral_2}>` : ''
        ].filter(Boolean).join(' ou ');

        return {
            shouldEngage: true, // Implicit
            title: template.title,
            description: this.replacePlaceholders(template.description, novato, serverName, socialChannels),
            cta: template.cta,
            emojis: template.emojis,
            tone: template.tone
        };
    }

    private replacePlaceholders(text: string, novato: Novato, serverName: string, channels: string): string {
        return text
            .replace(/{nome}/g, novato.nome)
            .replace(/{servidor}/g, serverName)
            .replace(/{canais_chat}/g, channels);
    }
}
