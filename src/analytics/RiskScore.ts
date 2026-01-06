import { Novato } from '../types';

export class RiskScore {
    static readonly INITIAL_SCORE = 100;
    static readonly MIN_SCORE = 0;
    static readonly MAX_SCORE = 100;

    static calculateInitialScore(memberCreatedAt: Date): number {
        // Optional: Higher risk if account is very new (suspected alt/raid)
        // For now, simpler approach: Everyone starts at 100 (Max need for engagement)
        return this.INITIAL_SCORE;
    }

    static onInteraction(currentScore: number, interactionType: string): number {
        let reduction = 0;

        switch (interactionType) {
            case 'message':
                reduction = 5;
                break;
            case 'reaction':
                reduction = 2;
                break;
            case 'button_click':
                reduction = 20; // High impact
                break;
            case 'voice_join':
                reduction = 15;
                break;
            default:
                reduction = 1;
        }

        return Math.max(this.MIN_SCORE, currentScore - reduction);
    }

    static shouldAlertStaff(novato: Novato): boolean {
        // Alert if high risk and time passed > threshold without interaction? 
        // Or if score is stuck at 100 for X hours.
        // For this implementation, we rely on the dashboard sorting by risk.
        return false;
    }
}
