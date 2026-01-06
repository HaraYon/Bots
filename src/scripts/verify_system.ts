
import { NovatoManager } from '../managers/NovatoManager';
import { PanelManager } from '../managers/PanelManager';
import { EngagementPanel } from '../systems/EngagementPanel';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

async function runTests() {
    console.log("\n🧪 STARTING SYSTEM VERIFICATION 🧪\n");

    // TEST 1: Environment & Config
    console.log("[1] Checking Environment...");
    if (!config.token || !config.clientId) {
        console.error("❌ FAILED: Missing DISCORD_TOKEN or CLIENT_ID in .env");
        process.exit(1);
    } else {
        console.log("✅ Config Loaded.");
    }

    // TEST 2: Data Directory
    console.log("\n[2] Checking Data Directories...");
    if (fs.existsSync(config.paths.data)) {
        const count = fs.readdirSync(config.paths.data).filter(f => f.endsWith('.json')).length;
        console.log(`✅ Data Directory exists. Files found: ${count}`);
    } else {
        console.warn("⚠️ Data Directory missing (will be created on startup).");
        // This is not a fatal error as the manager creates it.
    }

    // TEST 3: NovatoManager Initialization
    console.log("\n[3] Testing NovatoManager...");
    try {
        const novatoMgr = NovatoManager.getInstance();
        await novatoMgr.initialize();
        const novatos = await novatoMgr.getAllNovatos();
        console.log(`✅ NovatoManager Initialized. RAM Count: ${novatos.length}`);
    } catch (e) {
        console.error("❌ NovatoManager Failed:", e);
    }

    // TEST 4: PanelManager State
    console.log("\n[4] Testing PanelManager...");
    try {
        const panelMgr = PanelManager.getInstance();
        await panelMgr.initialize(); // Should load panel.json
        const state = panelMgr.getState();

        // Check for old legacy props (removed in cleanup)
        if ((state as any).style_mode !== undefined) {
            console.error("❌ FAILED: PanelState still contains 'style_mode'!");
        } else {
            console.log("✅ PanelState Schema is clean (no legacy configs).");
        }
        console.log(`✅ Current State: Active=${state.ativo}, Mode=${state.modo_operacao}`);
    } catch (e) {
        console.error("❌ PanelManager Failed:", e);
    }

    // TEST 5: EngagementPanel Syntax Load
    console.log("\n[5] Loading EngagementPanel Module...");
    try {
        // Just importing it is a test of syntax, but let's check a static method existence
        if (typeof EngagementPanel.generatePanel === 'function') {
            console.log("✅ EngagementPanel loaded successfully.");
        }
    } catch (e) {
        console.error("❌ EngagementPanel Syntax Error:", e);
    }

    console.log("\n🏁 VERIFICATION COMPLETE 🏁");
}

runTests().catch(console.error);
