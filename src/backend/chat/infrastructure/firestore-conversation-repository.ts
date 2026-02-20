
import { Conversation, ConversationStatus, Participant, RelatedEntity } from '@/backend/chat/domain/conversation';
import { ConversationRepository } from '@/backend/chat/domain/conversation-repository';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestoreConversationRepository implements ConversationRepository {
    private db;
    private collection;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
        this.collection = this.db.collection('conversations');
    }

    async save(conversation: Conversation): Promise<void> {
        await this.collection.doc(conversation.id).set({
            ...conversation,
            // Convert dates to Firestore timestamps if needed, or keep as ISO strings if standardized
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
            participants: conversation.participants,
            relatedEntity: conversation.relatedEntity,
            status: conversation.status,
            metadata: conversation.metadata,
            unreadCount: conversation.unreadCount
        });
    }

    async findById(id: string): Promise<Conversation | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return this.mapDocToConversation(doc.id, doc.data());
    }

    async findByLeadId(leadId: string): Promise<Conversation[]> {
        // Query logic: participants array contains object with id == leadId
        // Firestore array-contains-any logic for objects is tricky. 
        // Better approach: Query by relatedEntity.id if type is lead

        const snapshot = await this.collection
            .where('relatedEntity.type', '==', 'lead')
            .where('relatedEntity.id', '==', leadId)
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs.map((doc: any) => this.mapDocToConversation(doc.id, doc.data()));
    }

    async findActive(): Promise<Conversation[]> {
        const snapshot = await this.collection
            .where('status', 'in', ['active', 'waiting_for_admin', 'waiting_for_user'])
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs.map((doc: any) => this.mapDocToConversation(doc.id, doc.data()));
    }

    async findRecent(limit: number = 20): Promise<Conversation[]> {
        const snapshot = await this.collection
            .orderBy('updatedAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map((doc: any) => this.mapDocToConversation(doc.id, doc.data()));
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }

    private mapDocToConversation(id: string, data: any): Conversation {
        return new Conversation(
            id,
            data.participants as Participant[],
            data.relatedEntity as RelatedEntity,
            data.status as ConversationStatus,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.metadata,
            data.unreadCount || 0
        );
    }
}
