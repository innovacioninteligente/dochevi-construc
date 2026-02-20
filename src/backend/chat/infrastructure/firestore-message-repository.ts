
import { Message, MessageType, Attachment } from '@/backend/chat/domain/message';
import { Participant } from '@/backend/chat/domain/conversation';
import { MessageRepository } from '@/backend/chat/domain/message-repository';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestoreMessageRepository implements MessageRepository {
    private db;
    private collection;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
        this.collection = this.db.collection('messages');
    }

    async save(message: Message): Promise<void> {
        // Using top-level collection for messages
        await this.collection.doc(message.id).set({
            ...message,
            conversationId: message.conversationId,
            createdAt: message.createdAt.toISOString(),
            readAt: message.readAt ? message.readAt.toISOString() : null,
            sender: message.sender,
            content: message.content,
            type: message.type,
            attachments: message.attachments,
            metadata: message.metadata
        });
    }

    async findByConversationId(conversationId: string, limit: number = 50): Promise<Message[]> {
        const snapshot = await this.collection
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'asc') // Getting strictly chronological for chat view defaults
            // .limit(limit) // Limit might complicate full history load, keeping simple for now
            .get();

        return snapshot.docs.map((doc: any) => this.mapDocToMessage(doc.id, doc.data()));
    }

    async countUnread(conversationId: string): Promise<number> {
        const snapshot = await this.collection
            .where('conversationId', '==', conversationId)
            .where('readAt', '==', null)
            .count()
            .get();
        return snapshot.data().count;
    }

    async markAllAsRead(conversationId: string): Promise<void> {
        const batch = this.db.batch();
        const snapshot = await this.collection
            .where('conversationId', '==', conversationId)
            .where('readAt', '==', null)
            .get();

        if (snapshot.empty) return;

        const now = new Date().toISOString();
        snapshot.docs.forEach((doc: any) => {
            batch.update(doc.ref, { readAt: now });
        });

        await batch.commit();
        await batch.commit();
    }

    async deleteByConversationId(conversationId: string): Promise<void> {
        const snapshot = await this.collection.where('conversationId', '==', conversationId).get();
        if (snapshot.empty) return;

        const batch = this.db.batch();
        snapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }

    private mapDocToMessage(id: string, data: any): Message {
        return new Message(
            id,
            data.conversationId,
            data.sender as Participant,
            data.content,
            data.type as MessageType,
            data.attachments as Attachment[],
            new Date(data.createdAt),
            data.readAt ? new Date(data.readAt) : null,
            data.metadata
        );
    }
}
