import { NovatoManager } from './NovatoManager';
import { Novato } from '../types';

export interface DashboardStats {
    totalNovatos: number;
    mensagensEnviadas: number;
    botoesClicados: number;
    riscoAlto: number; // > 70
    riscoMedio: number; // 40-70
    riscoBaixo: number; // < 40
    active24h: number;
    conversionRate: string;
}

export class StatsManager {
    private manager: NovatoManager;

    constructor() {
        this.manager = NovatoManager.getInstance();
    }

    async getGlobalStats(): Promise<DashboardStats> {
        const novatos = await this.manager.getAllNovatos();

        const total = novatos.length;
        const sent = novatos.filter(n => n.mensagem_enviada).length;
        const clicked = novatos.filter(n => n.clicou_botao).length;

        const highRisk = novatos.filter(n => n.score_risco >= 70).length;
        const mediumRisk = novatos.filter(n => n.score_risco >= 40 && n.score_risco < 70).length;
        const lowRisk = novatos.filter(n => n.score_risco < 40).length;

        const oneDayMs = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const active24h = novatos.filter(n => (now - new Date(n.ultimo_update).getTime()) < oneDayMs).length;

        const conversion = sent > 0 ? ((clicked / sent) * 100).toFixed(1) + '%' : '0%';

        return {
            totalNovatos: total,
            mensagensEnviadas: sent,
            botoesClicados: clicked,
            riscoAlto: highRisk,
            riscoMedio: mediumRisk,
            riscoBaixo: lowRisk,
            active24h,
            conversionRate: conversion
        };
    }

    async getHighRiskNovatos(limit: number = 10): Promise<Novato[]> {
        const novatos = await this.manager.getAllNovatos();
        // Sort by risk desc
        return novatos
            .filter(n => n.score_risco >= 70)
            .sort((a, b) => b.score_risco - a.score_risco)
            .slice(0, limit);
    }
    async getHealthyNovatos(limit: number = 5): Promise<Novato[]> {
        const novatos = await this.manager.getAllNovatos();
        return novatos
            .filter(n => n.score_risco < 40) // Low risk = Healthy
            .sort((a, b) => new Date(b.ultimo_update).getTime() - new Date(a.ultimo_update).getTime()) // Most recently active
            .slice(0, limit);
    }

    async getRecentInteractions(limit: number = 5): Promise<{ novatoName: string, action: string, time: string }[]> {
        const novatos = await this.manager.getAllNovatos();
        const allInteractions: { novatoName: string, action: string, time: string, timestamp: number }[] = [];

        novatos.forEach(n => {
            n.interacoes.forEach(i => {
                allInteractions.push({
                    novatoName: n.nome,
                    action: i.acao,
                    time: i.timestamp,
                    timestamp: new Date(i.timestamp).getTime()
                });
            });
        });

        return allInteractions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}
