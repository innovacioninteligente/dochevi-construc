import { LeadRepository } from '../domain/lead-repository';
import { Lead, PersonalInfo, LeadPreferences, LeadVerification } from '../domain/lead';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestoreLeadRepository implements LeadRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    private toDomain(doc: FirebaseFirestore.DocumentSnapshot): Lead {
        const data = doc.data();
        if (!data) throw new Error(`Lead not found for id ${doc.id}`);

        return new Lead(
            doc.id,
            data.personalInfo as PersonalInfo,
            data.preferences as LeadPreferences,
            {
                isVerified: data.verification?.isVerified || false,
                otpCode: data.verification?.otpCode,
                otpExpiresAt: data.verification?.otpExpiresAt?.toDate(),
                verifiedAt: data.verification?.verifiedAt?.toDate(),
                attempts: data.verification?.attempts || 0
            } as LeadVerification,
            data.createdAt?.toDate() || new Date(),
            data.updatedAt?.toDate() || new Date()
        );
    }

    private toPersistence(lead: Lead): any {
        return {
            personalInfo: lead.personalInfo,
            preferences: lead.preferences,
            verification: {
                isVerified: lead.verification.isVerified,
                otpCode: lead.verification.otpCode || null,
                otpExpiresAt: lead.verification.otpExpiresAt || null,
                verifiedAt: lead.verification.verifiedAt || null,
                attempts: lead.verification.attempts
            },
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt
        };
    }

    async save(lead: Lead): Promise<void> {
        await this.db.collection('leads').doc(lead.id).set(this.toPersistence(lead));
    }

    async findById(id: string): Promise<Lead | null> {
        const doc = await this.db.collection('leads').doc(id).get();
        if (!doc.exists) return null;
        return this.toDomain(doc);
    }

    async findByEmail(email: string): Promise<Lead | null> {
        const snapshot = await this.db.collection('leads')
            .where('personalInfo.email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return this.toDomain(snapshot.docs[0]);
    }

    async search(query?: string): Promise<Lead[]> {
        // Simple search that returns recent leads, potentially filtered if query is provided
        // In a real app, this should use Algolia/Meilisearch for fuzzy search, but basic Firestore limit will do for MVP
        let queryRef: FirebaseFirestore.Query = this.db.collection('leads')
            .orderBy('createdAt', 'desc')
            .limit(50);

        const snapshot = await queryRef.get();

        let leads = snapshot.docs.map(doc => this.toDomain(doc));

        if (query && query.trim() !== '') {
            const q = query.toLowerCase().trim();
            leads = leads.filter(l =>
                l.personalInfo.name.toLowerCase().includes(q) ||
                l.personalInfo.email.toLowerCase().includes(q) ||
                l.personalInfo.phone.includes(q)
            );
        }

        return leads;
    }
}
