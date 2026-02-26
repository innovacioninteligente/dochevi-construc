
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function runTest() {
    console.log('Starting Decomposition Test...');

    // Dynamic import to ensuring dotenv is loaded FIRST
    const { resolveItemFlow } = await import('@/backend/ai/private/flows/resolve-item.flow');

    // We use a query that forces Triage to pick 'estimationAgent' (artistic/custom),
    // which in turn triggers our new Decomposition logic in resolve-item.flow.ts
    const input = "Mural artístico de mosaico con diseño de dragón para fondo de piscina";
    console.log(`\nTesting Decomposition for: "${input}" (Expecting Triage -> Estimation -> Decomposition)\n`);

    try {
        const result = await resolveItemFlow({
            taskDescription: input,
            quantity: 1,
            unit: 'u'
        });

        console.log('\n--- Result ---\n');
        console.log(JSON.stringify(result, null, 2));

        if (result.type === 'PARTIDA') {
            if (result.code === 'ASM-001') {
                console.log('\n✅ SUCCESS: Item was identified as an ASSEMBLY (ASM-001)');
                console.log(`Description: ${result.description}`);
                console.log(`Note: ${result.note}`);
                console.log(`Total Price: ${result.totalPrice}`);
            } else {
                console.log('\n❌ FAILURE: Item was NOT identified as an ASSEMBLY');
                console.log(`Received Type: ${result.type}`);
                console.log(`Received Code: ${result.code}`);
            }
        } else {
            console.log('\n❌ FAILURE: Result is a MATERIAL, not a PARTIDA');
            console.log(`Received Type: ${result.type}`);
            // BudgetMaterial does not have 'code', it has 'sku'
            console.log(`Received SKU: ${result.sku}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
