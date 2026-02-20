'use server';

import { CatalogSearchService } from '@/backend/catalog/application/catalog-search.service';
import { UnifiedCatalogItem } from '@/backend/catalog/domain/catalog-item';

const service = new CatalogSearchService();

export async function searchCatalogAction(query: string): Promise<UnifiedCatalogItem[]> {
    try {
        const results = await service.search(query);
        // Serialize simple JSON to avoid Date issues across boundary
        return JSON.parse(JSON.stringify(results));
    } catch (error) {
        console.error('[Action] searchCatalogAction error:', error);
        return [];
    }
}
