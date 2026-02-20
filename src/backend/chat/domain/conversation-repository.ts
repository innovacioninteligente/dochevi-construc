
import { Conversation } from './conversation';

export interface ConversationRepository {
    save(conversation: Conversation): Promise<void>;
    findById(id: string): Promise<Conversation | null>;
    findByLeadId(leadId: string): Promise<Conversation[]>;
    findActive(): Promise<Conversation[]>; // For admin dashboard
    findRecent(limit: number): Promise<Conversation[]>;
    delete(id: string): Promise<void>;
}
