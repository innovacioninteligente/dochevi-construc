'use server';

import { FirestoreProviderRepository } from '@/backend/expense/infrastructure/firestore-provider-repository';
import { Provider } from '@/backend/expense/domain/provider';

const providerRepository = new FirestoreProviderRepository();

export async function getAllProvidersAction(): Promise<Provider[]> {
    try {
        return await providerRepository.findAll();
    } catch (error) {
        console.error('Error fetching providers:', error);
        return [];
    }
}
