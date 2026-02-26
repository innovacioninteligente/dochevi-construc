
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function runTest() {
    console.log('Starting Architect Test...');

    // Dynamic import
    const { constructionArchitectAgent } = await import('@/backend/ai/private/agents/construction-architect.agent');

    const input = "Reforma integral de baño de 6m2 con cambio de bañera por plato de ducha y renovacion de instalaciones";
    console.log(`\nTesting Architect for: "${input}"\n`);

    try {
        const result = await constructionArchitectAgent({
            projectDescription: input
        });

        console.log('\n--- Result ---\n');
        console.log(JSON.stringify(result, null, 2));

        if (result.chapters && result.chapters.length >= 3) {
            console.log(`\n✅ SUCCESS: Architect identified ${result.chapters.length} chapters.`);
        } else {
            console.log(`\n❌ FAILURE: Architect identified too few chapters (${result.chapters?.length}).`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
