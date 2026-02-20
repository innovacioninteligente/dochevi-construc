// src/backend/budget/infrastructure/budget-repository-firestore.ts
import { Budget, BudgetRepository } from '../domain/budget';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

/**
 * Firestore implementation of the BudgetRepository.
 */
export class BudgetRepositoryFirestore implements BudgetRepository {
  private db;

  constructor() {
    initFirebaseAdminApp();
    this.db = getFirestore();
  }

  private get collection() {
    return this.db.collection('budgets');
  }

  async findById(id: string): Promise<Budget | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToBudget(doc);
  }

  async findByLeadId(leadId: string): Promise<Budget[]> {
    const snapshot = await this.collection.where('leadId', '==', leadId).get();
    return snapshot.docs.map(doc => this.mapDocToBudget(doc));
  }

  async findAll(): Promise<Budget[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => this.mapDocToBudget(doc));
  }

  async save(budget: Budget): Promise<void> {
    console.log(`[Infrastructure] Saving budget to Firestore: ${budget.id}`);
    await this.collection.doc(budget.id).set({
      ...budget,
      createdAt: budget.createdAt, // Ensure dates are handled (Firestore supports native Date)
      updatedAt: budget.updatedAt || new Date(),
    }, { merge: true });
  }

  async delete(id: string): Promise<void> {
    console.log(`[Infrastructure] Deleting budget from Firestore: ${id}`);
    await this.collection.doc(id).delete();
  }

  private mapDocToBudget(doc: any): Budget {
    const data = doc.data();

    // Map nested collections/arrays if they contain Timestamps
    const renders = data.renders?.map((r: any) => ({
      ...r,
      createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : (new Date(r.createdAt) || new Date())
    })) || [];

    return {
      ...data,
      id: doc.id,
      renders: renders,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt) || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (new Date(data.updatedAt) || new Date()),
      // Ensure we map back the new structure if needed, or default empty chapters if migrating
      chapters: data.chapters || [],
    } as Budget;
  }
}
