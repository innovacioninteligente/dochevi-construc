
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function runTest() {
    console.log('Starting Phase 3 Dynamic Decomposition Test...');

    // Dynamic import to ensuring dotenv is loaded FIRST
    const { resolveItemFlow } = await import('@/backend/ai/agents/resolve-item.flow');

    // Test Case: "Build a brick wall" 
    // This is simple enough to verify LLM breakdown (bricks + mortar) 
    // AND common enough to find matches in Price Book (Fabricas)
    const input = "Construcción de tabique de ladrillo hueco doble";
    console.log(`\nTesting Dynamic Decomposition for: "${input}"\n`);

    try {
        // Trigger decomposition by forcing a "no direct match" scenario? 
        // Or relying on Triage?
        // Actually, resolveItemFlow calls Analyst if BudgetSearch fails or Triage says estimation.
        // But "Ladrillo" might be found by BudgetSearch!
        // To FORCE decomposition for this test, let's call the Analyst Agent DIRECTLY.
        // This isolates the Unit Test for the Analyst Agent.

        const { constructionAnalystAgent } = await import('@/backend/ai/agents/construction-analyst.agent');

        const result = await constructionAnalystAgent({
            description: input
        });

        console.log('\n--- Result ---\n');
        console.log(`Found ${result.items.length} items.`);

        result.items.forEach((item: any) => {
            console.log(`\n[${item.code}] ${item.description}`);
            console.log(`   Price: ${item.unitPrice}€ x ${item.quantity} ${item.unit} = ${item.totalPrice}€`);
            console.log(`   Note: ${item.note}`);
            console.log(`   RealCost: ${item.isRealCost}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
