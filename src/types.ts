export interface NovatoInteraction {
    acao: string;
    timestamp: string; // ISO 8601
}

export interface EmbedPersonalizada {
    titulo: string;
    descricao: string;
    imagem_banner: string;
    footer: string;
    emojis: string[];
    botao: {
        label: string;
        acao: string;
    };
}

export interface EngagementContent {
    shouldEngage: boolean;
    title: string;
    description: string;
    cta: string;
    emojis: string[];
    tone: string;
}

export interface Novato {
    id: string;
    nome: string;
    entrada: string; // ISO 8601
    canais_visitados: string[];
    score_risco: number; // 0-100
    mensagem_enviada: boolean;
    clicou_botao: boolean;
    badge: string | null;
    interacoes: NovatoInteraction[];
    alertas_staff: string[];
    ultimo_update: string; // ISO 8601
    embed_personalizada?: EmbedPersonalizada;
}
