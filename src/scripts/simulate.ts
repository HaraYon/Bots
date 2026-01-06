import { NovatoManager } from '../managers/NovatoManager';
import { EmbedRenderer } from '../systems/EmbedRenderer';
import { EngagementRules } from '../systems/EngagementRules';
import { LocalTextEnhancer } from '../systems/LocalTextEnhancer';
import { VerificationEngine } from '../systems/VerificationEngine';
import { Client } from 'discord.js';

// Mock execution
async function runSimulation() {
    console.log("🚀 Iniciando Simulação do Sistema Determinístico (Local Only)...");

    // Mock Client for EmbedRenderer
    const mockGuild = { name: "Servidor de Teste", iconURL: () => "https://example.com/icon.png" };
    const mockClient = {
        guilds: { cache: { get: () => mockGuild } },
        user: { displayAvatarURL: () => "https://example.com/bot.png" },
        users: { fetch: async () => ({ createDM: async () => ({ send: () => console.log("   --> [Direct Message Sent]") }) }) }
    } as unknown as Client;

    // Instantiate Components
    const manager = NovatoManager.getInstance();
    const renderer = new EmbedRenderer(mockClient);
    const enhancer = new LocalTextEnhancer();

    // 1. Create User & Deterministic Join
    const fakeId = `sim-${Date.now()}`;
    const fakeName = `SimUser_${Math.floor(Math.random() * 100)}`;
    console.log(`\n1. Entrando usuário: ${fakeName} (${fakeId})`);

    // Using Manager
    const result = await manager.checkAndHandleJoin(fakeId, fakeName);
    console.log(`✅ Manager checkAndHandleJoin: ${result.status}`);

    const novatoRaw = await manager.getNovato(fakeId);
    if (!novatoRaw) throw new Error("Novato not found");

    const vResult = VerificationEngine.validate(novatoRaw);
    console.log(`✅ [VerificationEngine] Is Valid? ${vResult.isValid}`);


    // 2. Simulate Activity
    console.log(`\n2. Simulando Atividade (Voz & React)...`);
    await manager.addInteraction(fakeId, 'voice_join');
    await manager.addInteraction(fakeId, 'reaction');

    await manager.updateNovato(fakeId, {
        entrada: new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString() // 25 hours ago
    } as any);

    const targetNovato = (await manager.getNovato(fakeId))!;


    // 3. Run Engagement Logic
    console.log(`\n3. Executando Regras de Engajamento...`);
    const decision = EngagementRules.evaluate(targetNovato);
    console.log(`📊 Decisão: ShouldEngage=${decision.shouldEngage}`);
    console.log(`   Motivo: ${decision.reason}`);
    console.log(`   Contexto: ${decision.contextNote}`);


    // 4. Enhance & Render
    if (decision.shouldEngage) {
        console.log(`\n4. Solicitando Embelezamento Local (LocalTextEnhancer)...`);
        const enhancedContent = enhancer.enhance(targetNovato, "Servidor de Teste", decision.reason);

        console.log("✅ Template Selecionado com Sucesso!");
        console.log(`   Título: "${enhancedContent.title}"`);
        console.log(`   Tom: ${enhancedContent.tone}`);

        // 5. Render
        console.log(`\n5. Renderizando Embed Final...`);
        const { embed } = await renderer.render(targetNovato, enhancedContent);
        console.log("✅ Embed Gerado:");
        console.log(`   Title: ${embed.data.title}`);
        console.log(`   Desc: ${embed.data.description?.substring(0, 50)}...`);
        console.log(`   Fields: ${embed.data.fields?.map(f => f.name).join(", ")}`);
    } else {
        console.log("ℹ️ Decisão de não engajar (Regras).");
    }

    // 6. Verify Dashboard
    console.log(`\n6. Verificando Dashboard...`);
    const { generateDashboard } = await import('../utils/dashboard');
    const { StatsManager } = await import('../managers/StatsManager');
    const statsManager = new StatsManager();
    const { embed: dashEmbed } = await generateDashboard(statsManager);

    if (dashEmbed.data.fields?.length === 4) {
        console.log("✅ Dashboard renderizado com 4 blocos corretamente.");
    } else {
        console.error("❌ Dashboard incompleto!");
    }

    console.log("\n🚀 SIMULAÇÃO COMPLETA COM SUCESSO!");
}

runSimulation().catch(console.error);
