import { BudgetConfig, BudgetConfigRepository, DEFAULT_BUDGET_CONFIG } from '../domain/budget-config';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestoreBudgetConfigRepository implements BudgetConfigRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    async getConfig(): Promise<BudgetConfig> {
        const docRef = this.db.collection('budget_configs').doc(DEFAULT_BUDGET_CONFIG.id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // If strictly doesn't exist, we can return defaults without saving, 
            // or save defaults first. Let's return defaults to be safe and read-only by default.
            return DEFAULT_BUDGET_CONFIG;
        }

        const data = docSnap.data();

        // Ensure all fields are present (merge with default in case of schema updates)
        return {
            ...DEFAULT_BUDGET_CONFIG, // Base
            ...data, // Overwrites
            id: DEFAULT_BUDGET_CONFIG.id, // Enforce ID
            updatedAt: data?.updatedAt?.toDate() || new Date(), // Handle Timestamps
        } as BudgetConfig;
    }

    async saveConfig(config: BudgetConfig): Promise<void> {
        const docRef = this.db.collection('budget_configs').doc(config.id);

        await docRef.set({
            ...config,
            updatedAt: new Date(),
        }, { merge: true });
    }
}
