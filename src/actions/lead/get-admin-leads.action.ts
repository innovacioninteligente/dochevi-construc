'use server';

import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/firestore-lead-repository';

export async function getAdminLeadsAction(query?: string) {
    try {
        const repository = new FirestoreLeadRepository();

        const leads = await repository.search(query);

        return {
            success: true,
            leads: leads.map(l => ({
                id: l.id,
                name: l.personalInfo.name,
                email: l.personalInfo.email,
                phone: l.personalInfo.phone,
                address: l.personalInfo.address,
                isVerified: l.verification.isVerified,
                createdAt: l.createdAt
            }))
        };
    } catch (error: any) {
        console.error('getAdminLeadsAction Error:', error);
        return {
            success: false,
            error: error.message || 'Error al buscar clientes.'
        };
    }
}
