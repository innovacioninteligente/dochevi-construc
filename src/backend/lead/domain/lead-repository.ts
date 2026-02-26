import { Lead } from './lead';

export interface LeadRepository {
    save(lead: Lead): Promise<void>;
    findById(id: string): Promise<Lead | null>;
    findByEmail(email: string): Promise<Lead | null>;
    search(query?: string): Promise<Lead[]>;
}
