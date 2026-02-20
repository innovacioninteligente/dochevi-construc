
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function runTest() {
    console.log('Starting Recursive Flow Test...');

    // Dynamic import to ensure dotenv is loaded first
    const { generateBudgetRecurseFlow } = await import('@/backend/ai/agents/generate-budget-recurse.flow');

    // We use a simple project to avoid hitting rate limits with too many chapters
    const input = "Reforma integral de cocina de 10m2. Picado de alicatados, nuevas instalaciones de fontanería y electricidad, mueble de cocina en L y encimera de granito.";

    console.log(`\nTesting Recursive Flow for Kitchen Renovation (10m2) with Elevator Context...\n`);

    try {
        const result = await generateBudgetRecurseFlow({
            projectDescription: input,
            leadId: 'test-lead-id',
            totalArea: 10,
            projectContext: "Piso en planta 4ª CON ASCENSOR. Hay zona de carga y descarga habilitada."
        });

        console.log('\n--- Result ---\n');
        console.log(JSON.stringify(result, null, 2));

        if (result.chapters && result.chapters.length > 0) {
            console.log(`\n✅ SUCCESS: Generated budget with ${result.chapters.length} chapters.`);
            result.chapters.forEach((chapter: any) => {
                console.log(`   - Chapter: ${chapter.name} (${chapter.items.length} items)`);
                if (chapter.items.length > 0) {
                    console.log(`     First Item: ${chapter.items[0].description} (${chapter.items[0].totalPrice}€)`);
                }
            });
        } else {
            console.log('\n❌ FAILURE: No chapters generated.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
