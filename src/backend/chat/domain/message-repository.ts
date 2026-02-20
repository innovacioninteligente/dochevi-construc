
import { Message } from './message';

export interface MessageRepository {
    save(message: Message): Promise<void>;
    findByConversationId(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
    countUnread(conversationId: string): Promise<number>;
    markAllAsRead(conversationId: string): Promise<void>;
    deleteByConversationId(conversationId: string): Promise<void>;
}
