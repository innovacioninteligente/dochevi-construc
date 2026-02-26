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

  private sanitizeMatchedItem(matchedItem: any): any {
    if (!matchedItem) return undefined;
    try {
      if (matchedItem.embedding) delete matchedItem.embedding;

      const safeItem = {
        ...matchedItem,
        createdAt: matchedItem.createdAt?.toDate ? matchedItem.createdAt.toDate().toISOString() : matchedItem.createdAt,
        updatedAt: matchedItem.updatedAt?.toDate ? matchedItem.updatedAt.toDate().toISOString() : matchedItem.updatedAt,
      };

      return JSON.parse(JSON.stringify(safeItem));
    } catch (e) {
      console.error("[BudgetRepository] Safely stripped matchedItem due to parsing exception:", e);
      return undefined;
    }
  }

  private cleanItemOnRead(item: any): any {
    // Sanitize both root level (legacy) and inner item level (UI standard)
    const rootMatchedItem = this.sanitizeMatchedItem(item.matchedItem);

    let innerItem = item.item;
    if (innerItem) {
      innerItem = {
        ...innerItem,
        matchedItem: this.sanitizeMatchedItem(innerItem.matchedItem),
        candidates: innerItem.candidates || []
      };
    }

    return {
      ...item,
      matchedItem: rootMatchedItem,
      candidates: item.candidates || [],
      ...(innerItem ? { item: innerItem } : {})
    };
  }

  async findById(id: string): Promise<Budget | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const budget = this.mapDocToBudget(doc);

    // Phase 15 Hybrid Read Strategy: Fetch items subcollection if it exists
    const itemsSnap = await this.collection.doc(id).collection('items').get();

    if (!itemsSnap.empty) {
      // Reassemble from subcollection
      const extractedItems = itemsSnap.docs.map(d => this.cleanItemOnRead(d.data()));

      budget.chapters = budget.chapters.map(chapter => {
        const relItems = extractedItems
          .filter(i => i._chapterId === chapter.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        return {
          ...chapter,
          items: relItems
        };
      });
    }

    return budget;
  }

  async findByLeadId(leadId: string): Promise<Budget[]> {
    const snapshot = await this.collection.where('leadId', '==', leadId).get();
    // For lists, we don't necessarily need to eagerly load all 500 items per budget.
    // mapDocToBudget will give us the root metadata, and if it's an old monolithic budget it'll give the items too.
    return snapshot.docs.map(doc => this.mapDocToBudget(doc));
  }

  async findAll(): Promise<Budget[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => this.mapDocToBudget(doc));
  }

  async save(budget: Budget): Promise<void> {
    console.log(`[Infrastructure] Saving budget to Firestore: ${budget.id}`);

    const rootBudget = { ...budget };
    const allItemsToSave: any[] = [];

    // 1. Separate items from chapters and tag them with their parent chapter ID
    rootBudget.chapters = rootBudget.chapters.map(chapter => {
      const chapterItems = chapter.items || [];
      chapterItems.forEach(item => {
        allItemsToSave.push({
          ...item,
          _chapterId: chapter.id // hidden foreign key for reconstruction
        });
      });

      return {
        ...chapter,
        items: [] // wipe items from the root memory to prevent 1MB overflow
      };
    });

    (rootBudget as any).totalItems = allItemsToSave.length;
    rootBudget.createdAt = budget.createdAt;
    rootBudget.updatedAt = budget.updatedAt || new Date();

    const rootRef = this.collection.doc(budget.id);
    const itemsRef = rootRef.collection('items');

    // 2. Diff check to delete items that were removed in the UI
    const existingItemsSnap = await itemsRef.get();
    const existingItemIds = new Set(existingItemsSnap.docs.map(d => d.id));
    const incomingItemIds = new Set(allItemsToSave.map(i => i.id));

    const idsToDelete = [...existingItemIds].filter(id => !incomingItemIds.has(id));

    // 3. Batched Execution (Firestore limit 500 ops/batch)
    const MAX_BATCH_SIZE = 490;
    let batch = this.db.batch();
    let opCount = 0;

    batch.set(rootRef, rootBudget, { merge: true });
    opCount++;

    for (const id of idsToDelete) {
      if (opCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = this.db.batch();
        opCount = 0;
      }
      batch.delete(itemsRef.doc(id));
      opCount++;
    }

    for (const item of allItemsToSave) {
      if (opCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = this.db.batch();
        opCount = 0;
      }
      batch.set(itemsRef.doc(item.id), item, { merge: true });
      opCount++;
    }

    if (opCount > 0) {
      await batch.commit();
    }
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

    const chapters = data.chapters?.map((chapter: any) => ({
      ...chapter,
      items: chapter.items?.map((item: any) => this.cleanItemOnRead(item)) || []
    })) || [];

    return {
      ...data,
      id: doc.id,
      renders: renders,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt) || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (new Date(data.updatedAt) || new Date()),
      chapters: chapters,
    } as Budget;
  }
}
