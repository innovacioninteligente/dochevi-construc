import 'dotenv/config'; // Load env vars before anything else
import { constructionAnalystAgent } from '@/backend/ai/agents/construction-analyst.agent';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

async function main() {
    console.log("Checking Env Vars:", {
        email: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
        project: process.env.FIREBASE_PROJECT_ID
    });
    initFirebaseAdminApp();

    // Test Case: "Reforma integral" - notoriously difficult for single-shot RAG
    // "Desmontaje" often fails or hallucinates.
    // "Picar alicatados" often misses specific "Demolición" items.

    const description = `
    Reforma integral de cocina y baño.
    - Desmontaje de instalaciones existentes.
    - Picar alicatados de cocina y baño (40m2).
    - Retirada de escombros.
    `;

    console.log("🚀 Testing RAG Scalability Flow...");
    console.log("Input:", description);

    try {
        const result = await constructionAnalystAgent({
            description: description,
            leadId: 'test-rag-scalability'
        });

        console.log("\n✅ RAG Result Items:");
        result.items.forEach(item => {
            console.log(`\n[${item.code}] ${item.description}`);
            // @ts-ignore
            if (item.matchConfidence) console.log(`   Confidence: ${item.matchConfidence}%`);
            // @ts-ignore
            if (item.note) console.log(`   Note: ${item.note}`);
            console.log(`   Price: ${item.totalPrice}€`);
            if (item.originalTask) console.log(`   Origin: "${item.originalTask}"`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main();
