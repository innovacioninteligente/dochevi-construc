// src/backend/expense/infrastructure/firestore-expense-repository.ts
import { Expense, ExpenseRepository } from '../domain/expense';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

/**
 * Firestore implementation of the ExpenseRepository.
 * InvoiceLines are embedded as sub-arrays within the expense document.
 */
export class FirestoreExpenseRepository implements ExpenseRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    private get collection() {
        return this.db.collection('expenses');
    }

    async findById(id: string): Promise<Expense | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return this.mapDocToExpense(doc);
    }

    async findByProjectId(projectId: string): Promise<Expense[]> {
        const snapshot = await this.collection
            .where('projectId', '==', projectId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => this.mapDocToExpense(doc));
    }

    async findAll(): Promise<Expense[]> {
        const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => this.mapDocToExpense(doc));
    }

    async save(expense: Expense): Promise<void> {
        console.log(`[Infrastructure] Saving expense to Firestore: ${expense.id}`);
        await this.collection.doc(expense.id).set(
            {
                ...expense,
                createdAt: expense.createdAt,
                updatedAt: expense.updatedAt || new Date(),
            },
            { merge: true }
        );
    }

    async delete(id: string): Promise<void> {
        console.log(`[Infrastructure] Deleting expense from Firestore: ${id}`);
        await this.collection.doc(id).delete();
    }

    private mapDocToExpense(doc: FirebaseFirestore.DocumentSnapshot): Expense {
        const data = doc.data()!;

        return {
            ...data,
            id: doc.id,
            lines: data.lines || [],
            invoiceDate: data.invoiceDate?.toDate?.() ?? (data.invoiceDate ? new Date(data.invoiceDate) : undefined),
            createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt) ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt) ?? new Date(),
        } as Expense;
    }
}
