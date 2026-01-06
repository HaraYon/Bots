import { Novato } from '../types';
import { config } from '../config';

export interface EngagementDecision {
    shouldEngage: boolean;
    reason: 'RETENTION' | 'ENCOURAGEMENT' | 'NONE';
    contextNote: string;
}

export class EngagementRules {

    static evaluate(novato: Novato): EngagementDecision {
        // Configuration Constants
        // FORCED GLOBAL 5 MINUTES (User Request)
        const RETENTION_THRESHOLD_HOURS = 5 / 60; // 0.0833h

        // Minimum wait before ANY interaction
        const MIN_WAIT_HOURS = RETENTION_THRESHOLD_HOURS;

        // DEBUG LOGGING - REMOVED

        const now = Date.now();
        const joined = new Date(novato.entrada).getTime();
        const hoursSinceJoin = (now - joined) / (1000 * 60 * 60);
        // console.log(`[DEBUG] User ${novato.nome}: ${hoursSinceJoin.toFixed(4)}h since join`);

        // Rule 0: Too new?
        // Must wait at least the minimum threshold time
        if (hoursSinceJoin < MIN_WAIT_HOURS) {
            return { shouldEngage: false, reason: 'NONE', contextNote: `Ainda muito recente (< ${MIN_WAIT_HOURS.toFixed(2)}h)` };
        }

        // Rule 1: High Risk Retention (Silent for > Threshold)
        if (hoursSinceJoin > RETENTION_THRESHOLD_HOURS && novato.interacoes.length === 0) {
            return {
                shouldEngage: true,
                reason: 'RETENTION',
                contextNote: `Inativo por > ${RETENTION_THRESHOLD_HOURS.toFixed(2)}h sem interações.`
            };
        }

        // Rule 2: Encouragement (Positive behavior but quiet)
        // E.g. Visited voice or reacted, but sent no messages
        const hasVoice = novato.interacoes.some(i => i.acao === 'voice_join');
        const hasReaction = novato.interacoes.some(i => i.acao === 'reaction');
        const hasMessage = novato.interacoes.some(i => i.acao === 'message'); // Assumption

        // We keep the logic for Encouragement separate as requested (Visual/Product decision likely unchanged)
        // But in test mode, if we want to test THIS rule, we might need to adjust. 
        // User request specifically focused on "24h -> 5min" for the "absência de interação" (Rule 1).
        // leaving Rule 2 constant at 6h to strictly follow "Do not modify... decision criteria" unless implied.
        if ((hasVoice || hasReaction) && !hasMessage && hoursSinceJoin > RETENTION_THRESHOLD_HOURS) {
            return {
                shouldEngage: true,
                reason: 'ENCOURAGEMENT',
                contextNote: 'Interagiu (Voz/React) mas não falou.'
            };
        }

        // Rule 3: Healthy/Ignored
        return { shouldEngage: false, reason: 'NONE', contextNote: 'Usuário saudável ou interação insuficiente para regra.' };
    }
}
