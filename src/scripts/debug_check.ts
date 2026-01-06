
import { config } from '../config';
import { NovatoManager } from '../managers/NovatoManager';
import fs from 'fs';

async function run() {
    console.log("--- DEBUG START ---");
    console.log("Config Data Path:", config.paths.data);

    if (fs.existsSync(config.paths.data)) {
        const files = fs.readdirSync(config.paths.data);
        console.log(`Files in dir (${files.length}):`, files);
    } else {
        console.log("Data directory does not exist!");
    }

    const manager = NovatoManager.getInstance();
    await manager.initialize();
    const novatos = await manager.getAllNovatos();

    console.log("Manager Novatos Count:", novatos.length);
    novatos.forEach(n => console.log(` - Loaded: ${n.nome} (${n.id}) valid=${!!n.id}`));
    console.log("--- DEBUG END ---");
}

run().catch(console.error);
