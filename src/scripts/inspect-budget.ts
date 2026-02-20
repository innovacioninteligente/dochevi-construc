
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function inspectBudget(budgetId: string) {
    console.log(`\nInspecting Budget ID: ${budgetId}...\n`);

    // Dynamic import to ensure dotenv is loaded first
    const { BudgetRepositoryFirestore } = await import('@/backend/budget/infrastructure/budget-repository-firestore');

    const repo = new BudgetRepositoryFirestore();
    const budget = await repo.findById(budgetId);

    if (!budget) {
        console.error('❌ Budget not found.');
        return;
    }

    console.log(`Project: ${budget.specs.propertyType} - ${budget.specs.interventionType}`);
    console.log(`Total Estimated: ${budget.totalEstimated}€`);
    console.log(`Chapters: ${budget.chapters.length}`);

    budget.chapters.forEach(chapter => {
        console.log(`\n📂 Chapter: ${chapter.name} (${chapter.items.length} items)`);
        chapter.items.forEach(item => {
            console.log(`   - [${(item as any).code || 'NO-CODE'}] ${item.description}`);
            console.log(`     Qty: ${item.quantity} ${item.unit} | Price: ${item.unitPrice}€ | Total: ${item.totalPrice}€`);
            console.log(`     Type: ${item.type} | IsEstimate: ${item.isEstimate}`);
            if (item.note) console.log(`     Note: ${item.note}`);
        });
    });
}

const id = process.argv[2] || 'b3ec704f-4b7e-4671-b323-0a8e93dc6a6a';
inspectBudget(id);
