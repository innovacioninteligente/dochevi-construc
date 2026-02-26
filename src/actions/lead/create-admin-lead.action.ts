'use server';

import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/firestore-lead-repository';
import { Lead } from '@/backend/lead/domain/lead';
import { v4 as uuidv4 } from 'uuid';

export async function createAdminLeadAction(data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
}) {
    try {
        const repository = new FirestoreLeadRepository();

        // 1. Check if email already exists to prevent hard duplicates
        const existing = await repository.findByEmail(data.email);
        if (existing) {
            return {
                success: false,
                error: 'Ya existe un cliente con este correo electrónico.'
            };
        }

        // 2. Create the Lead natively as verified
        const newLeadId = uuidv4();
        const newLead = Lead.create(
            newLeadId,
            {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address
            },
            {
                contactMethod: 'email',
                language: 'es'
            }
        );

        // Mark as verified since an admin is creating it
        newLead.verification = {
            isVerified: true,
            verifiedAt: new Date(),
            attempts: 0
        };

        // 3. Persist
        await repository.save(newLead);

        return {
            success: true,
            lead: {
                id: newLead.id,
                name: newLead.personalInfo.name,
                email: newLead.personalInfo.email,
                phone: newLead.personalInfo.phone,
                address: newLead.personalInfo.address
            }
        };
    } catch (error: any) {
        console.error('createAdminLeadAction Error:', error);
        return {
            success: false,
            error: error.message || 'Error al crear el cliente.'
        };
    }
}
