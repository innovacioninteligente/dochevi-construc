import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // Fallback to .env

// import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';

const BUDGET_ID = '2d48f677-d953-4ce8-836b-1da858836822';

async function main() {
    console.log(`Diagnosticating Budget ID: ${BUDGET_ID}...`);
    console.log("Environment check:");
    console.log("FIREBASE_CLIENT_EMAIL present:", !!process.env.FIREBASE_CLIENT_EMAIL);

    // Import after env vars are loaded
    const { BudgetRepositoryFirestore } = await import('@/backend/budget/infrastructure/budget-repository-firestore');
    console.log("FIREBASE_PRIVATE_KEY present:", !!process.env.FIREBASE_PRIVATE_KEY);
    console.log("GCLOUD_PROJECT:", process.env.GCLOUD_PROJECT);
    console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);

    try {
        const repository = new BudgetRepositoryFirestore();
        const budget = await repository.findById(BUDGET_ID);

        if (!budget) {
            console.error("❌ Budget not found in Firestore.");
            return;
        }

        console.log(`\n✅ Budget Found: ${budget.id}`);
        console.log(`   Type: ${budget.type}`);
        console.log(`   Status: ${budget.status}`);
        console.log(`   Total Estimated: ${budget.costBreakdown?.total || budget.totalEstimated}`);

        console.log(`\n--- CHAPTERS (${budget.chapters?.length || 0}) ---`);
        budget.chapters?.forEach(chapter => {
            console.log(`\n📁 Chapter: ${chapter.name} (Total: ${chapter.totalPrice})`);
            console.log(`   Items (${chapter.items.length}):`);

            chapter.items.forEach((item, index) => {
                const icon = item.type === 'MATERIAL' ? '📦' : '🔨';
                const name = item.type === 'MATERIAL' ? item.name : item.description;
                console.log(`     ${index + 1}. ${icon} [${item.type}] ${name} (Qty: ${item.quantity})`);
                if (item.type === 'MATERIAL' && 'sku' in item) {
                    console.log(`        SKU: ${item.sku} | Merchant: ${item.merchant}`);
                }
                if (item.type === 'PARTIDA' && 'code' in item) {
                    console.log(`        Code: ${item.code}`);
                    // Check for linked material
                    if ('relatedMaterial' in item && item.relatedMaterial) {
                        console.log(`        🔗 Linked Material: ${item.relatedMaterial.name} (${item.relatedMaterial.sku}) - ${item.relatedMaterial.unitPrice}€`);
                    }
                }
            });
        });

        console.log(`\n--- DIAGNOSIS ---`);
        const materialCount = budget.chapters?.flatMap(c => c.items).filter(i => i.type === 'MATERIAL').length || 0;
        const partidaCount = budget.chapters?.flatMap(c => c.items).filter(i => i.type === 'PARTIDA').length || 0;
        const linkedMaterialCount = budget.chapters?.flatMap(c => c.items).filter(i => i.type === 'PARTIDA' && 'relatedMaterial' in i && i.relatedMaterial).length || 0;

        console.log(`Total Partidas: ${partidaCount}`);
        console.log(`Total Materials (Standalone): ${materialCount}`);
        console.log(`Total Materials (Linked): ${linkedMaterialCount}`);

        if (materialCount === 0 && linkedMaterialCount === 0) {
            console.warn("⚠️  WARNING: No items of type 'MATERIAL' found in budget.");
        }

    } catch (error) {
        console.error("Error diagnosing budget:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
    }
}

main().catch(console.error);
