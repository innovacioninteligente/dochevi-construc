import { config } from 'dotenv';
config({ path: '.env.local' });
config();

// Imports removed from top level to allow dotenv to load first

// STRESS TEST SCENARIO: Luxury House
const LUXURY_HOUSE_PROMPT = `
Quiero un presupuesto detallado para la construcción de una vivienda unifamiliar de lujo de 300m2 en dos plantas + sótano.

Especificaciones:
1. Cimentación y Estructura:
   - Excavación para sótano en terreno duro.
   - Cimentación por zapatas aisladas y muro de contención de hormigón armado.
   - Estructura de hormigón reticular.

2. Fachada y Cubierta:
   - Fachada ventilada con piedra caliza "Niwa" abujardada.
   - Cubierta plana invertida transitable con acabado en grava blanca.
   - Aislamiento térmico de alto rendimiento (SATE o similar).

3. Interiores (Acabados de Lujo):
   - Pavimento general: Suelo porcelánico imitación madera de la marca Keraben (Modelo Forest Beige).
   - Baños (4 unidades): Alicatado con mármol travertino y sanitarios suspendidos Roca Meridian.
   - Cocina: Solado de microcemento gris perla.

4. Exteriores:
   - Piscina infinity de 8x4m con gresite blanco y depuración salina.
   - Zona de parking (50m2) con hormigón impreso.

Por favor, desglosa por capítulos y utiliza precios de mercado actualizados.
`;

async function runStressTest() {
    console.log("🚀 Starting Full Scale Stress Test: 'Luxury House 300m2'...");

    // Dynamic imports to ensure env vars are loaded first
    const { generateBudgetFlow } = await import('@/backend/ai/flows/budget/generate-budget.flow');
    const { BudgetRepositoryFirestore } = await import('@/backend/budget/infrastructure/budget-repository-firestore');

    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error("❌ GOOGLE_GENAI_API_KEY is missing!");
        process.exit(1);
    }

    try {
        console.log("\n[1] 🧠 Generating Budget via Agentic Flow...");
        console.log("    Prompt Length:", LUXURY_HOUSE_PROMPT.length, "chars");

        const startTime = Date.now();
        const result = await generateBudgetFlow({ userRequest: LUXURY_HOUSE_PROMPT });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`\n✅ Generation Complete in ${duration.toFixed(1)}s`);
        console.log(`    Total Chapters: ${result.chapters.length}`);
        console.log(`    Total Estimated Cost: ${result.totalEstimated.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`);

        console.log("\n[2] 💾 Simulating Persistence (Save to Firestore)...");
        // We artificially create a budget object to save, simulating the action
        const repo = new BudgetRepositoryFirestore();

        // Mock ID for test
        const testBudgetId = `stress-test-${Date.now()}`;

        const budgetToSave = {
            id: testBudgetId,
            leadId: 'stress-test-user',
            propertyId: 'mock-property',
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
            chapters: result.chapters,
            costBreakdown: result.costBreakdown,
            totalEstimated: result.totalEstimated,
            config: {
                iva: 0.21,
                overheadExpenses: 0.13,
                industrialBenefit: 0.06,
                globalAdjustmentFactor: 1.0,
                regionalPricing: 'ES_General'
            },
            name: 'Luxury House Stress Test',
            description: 'Automated Stress Test',
            history: []
        };

        await repo.save(budgetToSave as any); // Type casting for simplicity in test
        console.log(`✅ Saved Budget ID: ${testBudgetId}`);

        console.log("\n[3] 🔍 Verifying Breakdown Details...");
        let hybridItemsCount = 0;

        result.chapters.forEach(chapter => {
            console.log(`\n   📂 Chapter: ${chapter.name}`);
            chapter.items.forEach(item => {
                if (item.type === 'PARTIDA') {
                    if ((item as any).isRealCost) {
                        hybridItemsCount++;
                        console.log(`      ✨ HYBRID ITEM: ${item.description.substring(0, 50)}...`);
                        console.log(`         -> Real Cost: ${item.unitPrice}€ (Breakdown available)`);
                        const breakdown = (item as any).breakdown;
                        if (breakdown) {
                            console.log(`         -> Breakdown: Mat=${breakdown.find((b: any) => b.type === 'MATERIAL')?.total.toFixed(2)}€ | Lab=${breakdown.find((b: any) => b.type === 'LABOR')?.total.toFixed(2)}€`);
                        }
                    } else {
                        console.log(`      🔹 Generic Item: ${item.description.substring(0, 50)}... (${item.unitPrice}€)`);
                    }
                }
            });
        });

        console.log(`\n---------------------------------------------------------`);
        console.log(`📊 SUMMARY`);
        console.log(`   Hybrid Items (AparejadorIA): ${hybridItemsCount}`);
        console.log(`   Generic Items (PriceBook):   ${result.chapters.reduce((acc, c) => acc + c.items.length, 0) - hybridItemsCount}`);
        console.log(`---------------------------------------------------------`);

    } catch (error) {
        console.error("\n❌ Stress Test Failed:", error);
    }
}

runStressTest().catch(console.error);
