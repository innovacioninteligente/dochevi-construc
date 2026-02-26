import { config } from 'dotenv';
config({ path: '.env.local' });
config();

// Agents will be imported dynamically after dotenv config
// import { budgetSearchAgent } from '@/backend/ai/private/agents/budget-search.agent';
// import { triageAgent } from '@/backend/ai/public/agents/triage.agent';
// import { resolveItemFlow } from '@/backend/ai/private/flows/resolve-item.flow';

const TEST_CASES = [
    {
        name: "Suelo Keraben (Material Específico)",
        prompt: "Pavimento porcelánico imitación madera de la marca Keraben",
        quantity: 140,
        unit: 'm2'
    },
    // {
    //     name: "Ventanas PVC (Carpintería)",
    //     prompt: "Ventanas de PVC color gris antracita con rotura de puente térmico",
    //     quantity: 10,
    //     unit: 'u'
    // },
    // {
    //     name: "Cimentación (Partida Genérica)",
    //     prompt: "Realizar cimentación con zapatas de hormigón armado",
    //     quantity: 1,
    //     unit: 'ud'
    // }
];

async function runDebug() {
    console.log("🔍 Starting Multi-Agent Debug Session...\n");
    console.log("GENAI_API_KEY present:", !!process.env.GOOGLE_GENAI_API_KEY);

    // Dynamic Import to respect dotenv
    const { triageAgent } = await import('@/backend/ai/public/agents/triage.agent');
    const { budgetSearchAgent } = await import('@/backend/ai/private/agents/budget-search.agent');
    const { priceBookRetrieverTool } = await import('@/backend/ai/core/tools/price-book-retriever.tool');

    console.log("\n🧪 MANUAL PB TEST 1: 'Pavimento porcelánico'");
    const pbTest1 = await priceBookRetrieverTool({ query: 'Pavimento porcelánico', limit: 1, year: 2024 });
    console.log("Results 1:", JSON.stringify(pbTest1.items?.map(i => i.description), null, 2));

    console.log("\n🧪 MANUAL PB TEST 2: 'Pavimento porcelánico imitación madera'");
    const pbTest2 = await priceBookRetrieverTool({ query: 'Pavimento porcelánico imitación madera', limit: 1, year: 2024 });
    console.log("Results 2:", JSON.stringify(pbTest2.items?.map(i => i.description), null, 2));

    for (const test of TEST_CASES) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`🧪 TEST CASE: "${test.name}"`);
        console.log(`   Prompt: "${test.prompt}"`);
        console.log(`---------------------------------------------------------`);

        // 1. Triage
        console.log(`\n[1] 🧠 TRIAGE AGENT`);
        const triageResult = await triageAgent({ userRequest: test.prompt });
        console.log(`   Selected Tool: ${triageResult.tool}`);
        console.log(`   Reasoning: ${triageResult.reasoning}`);
        console.log(`   Params:`, triageResult.parameters);

        if (triageResult.tool === 'budgetSearchAgent') {
            // 2. Search
            console.log(`\n[2] 🔎 BUDGET SEARCH AGENT`);
            const query = triageResult.parameters.query;
            console.log(`   Searching for: "${query}" (Intent: ${triageResult.parameters.intent})`);

            const searchResult = await budgetSearchAgent({
                query: query,
                generic_query: triageResult.parameters.generic_query,
                intent: triageResult.parameters.intent || 'BOTH'
            });

            console.log(`   Result Source: ${searchResult.source}`);
            if (searchResult.partida) {
                console.log(`   ✅ Partida Found: ${searchResult.partida.description} (${searchResult.partida.priceTotal}€)`);
            } else {
                console.log(`   ❌ No Partida Found`);
            }

            if (searchResult.material) {
                console.log(`   ✅ Material Found: ${searchResult.material.name} (SKU: ${searchResult.material.sku}) - ${searchResult.material.price}€`);
            } else {
                console.log(`   ❌ No Material Found`);
            }

            // 3. Resolution (Flow)
            console.log(`\n[3] 🔄 RESOLVE ITEM FLOW (Simulation)`);
            // We verify what the flow WOULD produce given this search result
            if (searchResult.partida && searchResult.material) {
                console.log(`   👉 Outcome: Linked Material to Partida`);
            } else if (searchResult.partida) {
                console.log(`   👉 Outcome: Partida Only`);
            } else if (searchResult.material) {
                console.log(`   👉 Outcome: Material Only`);
            } else {
                console.log(`   👉 Outcome: Fallback to Estimation`);
            }

        } else {
            console.log(`\n[2] ⏭️ Skipping Search (Delegated to ${triageResult.tool})`);
        }
    }
}

runDebug().catch(console.error);
