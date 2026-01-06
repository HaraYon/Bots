import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    Client
} from 'discord.js';
import { PanelManager } from '../managers/PanelManager';
import { EmbedGenerator } from './EmbedGenerator';
import { config } from '../config';
import { NovatoManager } from '../managers/NovatoManager';

type PanelView = 'HOME' | 'DISCOVERY' | 'DEPLOYMENT';

export class EngagementPanel {

    // --- Montagem da UI ---

    static async generatePanel(client: Client, view: PanelView = 'HOME') {
        const manager = PanelManager.getInstance();
        const state = manager.getState();

        // --- Visual Core (The "Kernel" Look) ---
        // Usamos codeblocks para criar a estética de "Terminal"

        const statusIndicator = state.ativo ? '● ONLINE' : '○ PAUSED';
        const modeIndicator = state.modo_operacao === 'manual' ? '◼ MANUAL'
            : state.modo_operacao === 'semi_automatico' ? '▶ SEMI-AUTO'
                : '⛔ DISABLED';

        const uptime = '04h 12m'; // Placeholder - Ideal seria calcular baseado no uptime do cliente ou última inicialização

        // Cabeçalho Técnico
        const header = [
            '```yaml',
            `STATUS   : ${statusIndicator}`,
            `MODO     : ${modeIndicator}`,
            `UPTIME   : ${uptime}`,
            '```'
        ].join('\n');

        const embed = new EmbedBuilder()
            .setTitle('❖ PUREZA')
            .setColor(state.ativo ? '#4400ff' : '#ff0000') // Roxo marca ou Vermelho alerta
            .setDescription(header)
            .setFooter({
                text: `Sessão Segura • ID: ${client.user?.id} • Rev. 2.0`,
                iconURL: client.user?.displayAvatarURL()
            })
            .setTimestamp();

        // --- Conteúdo Dinâmico por View ---

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        if (view === 'HOME') {
            const telemetryText = !state.ativo
                ? '`Sistema pausado. Operações suspensas.`\nReative o sistema para retomar protocolos.'
                : state.modo_operacao === 'desligado'
                    ? '`Sistema online, mas desligado via controle manual.`\nAguardando reconfiguração de modo.'
                    : '`Sistema online. Em estado ocioso, aguardando comando.`\nPronto para iniciar novos disparos ou varreduras.';

            embed.addFields({
                name: '>_ TELEMETRIA',
                value: telemetryText,
                inline: false
            });

            // Botões Nível 0 (Hub)
            const btnState = new ButtonBuilder()
                .setCustomId('panel_state_toggle')
                .setLabel(state.ativo ? '[ Sistema: Online ]' : '[ Sistema: Pausado ]')
                .setStyle(state.ativo ? ButtonStyle.Success : ButtonStyle.Secondary);

            const btnMode = new ButtonBuilder()
                .setCustomId('panel_mode_cycle')
                .setLabel(`[ Modo: ${state.modo_operacao === 'manual' ? 'Manual' : state.modo_operacao === 'semi_automatico' ? 'Semi-Auto' : 'Desligado'} ]`)
                .setStyle(ButtonStyle.Primary);

            // Navegação
            const btnDiscovery = new ButtonBuilder().setCustomId('panel_nav_discovery').setLabel('📡 Monitoramento').setStyle(ButtonStyle.Secondary);
            const btnDeployment = new ButtonBuilder().setCustomId('panel_nav_deployment').setLabel('⚡ Operações').setStyle(ButtonStyle.Secondary);
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnState, btnMode));
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnDiscovery, btnDeployment));

        } else if (view === 'DISCOVERY') {
            embed.addFields({
                name: '📡 MONITORAMENTO',
                value: '```ini\n[ Módulo de Análise ]\nVarredura de sinais e filtragem de candidatos.\n```\n> *Parâmetros de busca: OK*',
                inline: false
            });

            const btnScan = new ButtonBuilder().setCustomId('panel_leitura_scan').setLabel('Executar Varredura').setEmoji('🔍').setStyle(ButtonStyle.Primary);
            const btnView = new ButtonBuilder().setCustomId('panel_leitura_view').setLabel('Ver Candidatos').setEmoji('📊').setStyle(ButtonStyle.Secondary);
            const btnBack = new ButtonBuilder().setCustomId('panel_nav_home').setLabel('‹ Retornar ao Kernel').setStyle(ButtonStyle.Danger);

            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnScan, btnView));
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnBack));

        } else if (view === 'DEPLOYMENT') {
            embed.addFields({
                name: '⚡ OPERAÇÕES',
                value: '```yaml\nWARN: Ações neste módulo executam disparos reais.\n```\n> *Confirme os alvos antes da execução.*',
                inline: false
            });

            const btnSim = new ButtonBuilder().setCustomId('panel_exec_sim').setLabel('Simular Protocolo').setEmoji('🧪').setStyle(ButtonStyle.Success);
            const btnFire = new ButtonBuilder().setCustomId('panel_exec_send').setLabel('EXECUTAR DISPARO').setEmoji('🔴').setStyle(ButtonStyle.Danger);
            const btnResend = new ButtonBuilder().setCustomId('panel_exec_resend').setLabel('Re-tentar Falhas').setEmoji('🔄').setStyle(ButtonStyle.Secondary);
            const btnBack = new ButtonBuilder().setCustomId('panel_nav_home').setLabel('‹ Retornar ao Kernel').setStyle(ButtonStyle.Secondary);

            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnSim, btnFire, btnResend));
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(btnBack));
        }

        return {
            embeds: [embed],
            components: rows
        };

    }

    // --- Tratamento das Interações ---

    static async handleInteraction(interaction: ButtonInteraction) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            await interaction.deferUpdate();
            return;
        }

        const customId = interaction.customId;
        const manager = PanelManager.getInstance();
        let currentView: PanelView = 'HOME'; // Estado padrão da view (stateless por enquanto, recalcula)

        // Tenta inferir a view atual baseada no botão apertado ou argumentos ocultos se tivéssemos.
        // Como o painel é persistente, o jeito "fácil" é que botões de navegação definem a view de resposta.
        // Botões de ação mantêm a view onde estão.

        // Lógica de Navegação Base
        if (customId === 'panel_nav_home') currentView = 'HOME';
        else if (customId === 'panel_nav_discovery') currentView = 'DISCOVERY';
        else if (customId === 'panel_nav_deployment') currentView = 'DEPLOYMENT';

        // Mantém na view atual se for ação interna do módulo
        else if (['panel_leitura_scan', 'panel_leitura_view'].includes(customId)) currentView = 'DISCOVERY';
        else if (['panel_exec_sim', 'panel_exec_send', 'panel_exec_resend'].includes(customId)) currentView = 'DEPLOYMENT';

        try {
            // 0. Safety Defer - Garante que o Discord não dê timeout
            // Se for navegação ou ação simples de view, fazemos update.
            // Se for ação complexa (scan/simulação), o handler específico deve lidar.
            // Vamos deixar os handlers específicos fazerem o defer se precisarem de tempo.

            // 1. Toggle State
            if (customId === 'panel_state_toggle') {
                const s = manager.getState();
                await manager.updateState({ ativo: !s.ativo });
                await manager.logAction(s.ativo ? 'Pausar Sistema' : 'Ativar Sistema', interaction.user.id);
                currentView = 'HOME';
            }

            // 2. Cycle Mode
            else if (customId === 'panel_mode_cycle') {
                const s = manager.getState();
                const modes = ['manual', 'semi_automatico', 'desligado'] as const;
                const idx = modes.indexOf(s.modo_operacao);
                const nextMode = modes[(idx + 1) % modes.length];
                await manager.updateState({ modo_operacao: nextMode });
                await manager.logAction(`Alterar modo para ${nextMode}`, interaction.user.id);
                currentView = 'HOME';
            }

            // 3. Simulação (Mantida)
            else if (customId === 'panel_exec_sim') {
                const fakeName = `Simulado_${Math.floor(Math.random() * 100)}`;
                const mockNovato = {
                    id: 'sim-preview',
                    nome: fakeName,
                    entrada: new Date().toISOString(),
                    canais_visitados: [],
                    score_risco: 100,
                    mensagem_enviada: false,
                    clicou_botao: false,
                    badge: null,
                    interacoes: [],
                    alertas_staff: [],
                    ultimo_update: new Date().toISOString()
                };

                const embedGenerator = new EmbedGenerator(interaction.client);
                const { embed: welcomeEmbed, components: welcomeComponents } = await embedGenerator.generate(mockNovato as any);

                await interaction.reply({
                    content: `\`[LOG_SIMULACAO]\` Teste de broadcast para: **${fakeName}**`,
                    embeds: [welcomeEmbed],
                    components: welcomeComponents,
                    flags: 64
                });

                await manager.logAction('Simular Envio', interaction.user.id);
                return; // Retorna pois já respondeu (reply)
            }

            // 4. Scan Protocol
            else if (customId === 'panel_leitura_scan') {
                await interaction.deferReply({ flags: 64 });

                // 1. Load Database
                const novatoManager = NovatoManager.getInstance();
                const allNovatos = await novatoManager.getAllNovatos();

                // 2. Scan Guild (True Sweep)
                const guild = interaction.guild;
                if (!guild) {
                    await interaction.editReply({ content: '`[ERRO]` Falha de conexão com o servidor para varredura de espectro.' });
                    return;
                }

                // Fetch real users (filter bots)
                try {
                    const members = await guild.members.fetch();
                    const realUsers = members.filter(m => !m.user.bot);

                    // 3. Compare Data
                    const trackedIds = new Set(allNovatos.map(n => n.id));
                    const untracked = realUsers.filter(m => !trackedIds.has(m.id));

                    // 4. Stats
                    const count = allNovatos.length;
                    const highRisk = allNovatos.filter(n => n.score_risco < 50).length;

                    await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay

                    await interaction.editReply({
                        content: `\`[RESULTADO_VARREDURA]\` Varredura de espectro finalizada.\n\n> **População Detectada:** ${realUsers.size}\n> **Alvos Monitorados (DB):** ${count}\n> **Novos Candidatos (Não Rastreados):** ${untracked.size}\n> **Risco Crítico:** ${highRisk}`
                    });

                    await manager.logAction('Scan Completo', interaction.user.id);

                } catch (timeout) {
                    await interaction.editReply({ content: '`[TIMEOUT]` O servidor demorou muito para responder. Tente novamente.' });
                }
                return;
            }

            // 5. View Candidates
            else if (customId === 'panel_leitura_view') {
                const novatoManager = NovatoManager.getInstance();
                const allNovatos = await novatoManager.getAllNovatos();
                const recent = allNovatos
                    .sort((a, b) => new Date(b.entrada).getTime() - new Date(a.entrada).getTime())
                    .slice(0, 5);

                const list = recent.length > 0
                    ? recent.map(n => `• **${n.nome}** (Risco: ${n.score_risco}%)`).join('\n')
                    : 'Nenhum registro recente.';

                await interaction.reply({
                    content: `\`[BANCO_DE_DADOS]\` Últimas 5 entradas:\n\n${list}`,
                    flags: 64
                });
                return;
            }

            // 6. Execute Broadcast
            else if (customId === 'panel_exec_send') {
                await interaction.deferReply({ flags: 64 });
                // Confirmação de segurança
                await interaction.editReply({
                    content: '⚠️ **PROTOCOLO INICIADO**\nDisparando mensagens para alvos...\n\n`[LOG] Enviadas: 0.`\n`[LOG] Erros: 0.`'
                });
                await manager.logAction('Execução em Massa', interaction.user.id);
                return;
            }

            // 7. System Configs Actions (REMOVIDO)
            // if (customId.startsWith('cfg_')) { ... }

            // Atualiza o Painel com a View correta
            const { embeds, components } = await EngagementPanel.generatePanel(interaction.client, currentView);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds, components });
            } else {
                await interaction.update({ embeds, components });
            }

        } catch (error) {
            console.error("Critical Failure in Panel Kernel", error);
            if (!interaction.replied) {
                await interaction.deferUpdate();
            }
        }
    }
}
