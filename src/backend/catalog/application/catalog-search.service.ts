
import { PriceBookRepository } from '@/backend/price-book/domain/price-book-repository'; // Interface
import { FirestorePriceBookRepository } from '@/backend/price-book/infrastructure/firestore-price-book-repository';
import { FirestoreMaterialCatalogRepository } from '@/backend/material-catalog/infrastructure/firestore-material-catalog-repository';
import { UnifiedCatalogItem } from '../domain/catalog-item';
import { RestApiVectorizerAdapter } from '@/backend/price-book/infrastructure/ai/rest-api-vectorizer.adapter';

export class CatalogSearchService {
    private priceBookRepo: FirestorePriceBookRepository;
    private materialRepo: FirestoreMaterialCatalogRepository;
    private vectorizer: RestApiVectorizerAdapter;

    constructor() {
        // In a real DI system we would inject these, but for now we instantiate them
        // or accept them in constructor if we want to mock.
        this.priceBookRepo = new FirestorePriceBookRepository();
        this.materialRepo = new FirestoreMaterialCatalogRepository();
        this.vectorizer = new RestApiVectorizerAdapter();
    }

    async search(query: string, limitPerSource: number = 5, context?: string, domain: 'ALL' | 'LABOR' | 'MATERIAL' = 'ALL'): Promise<UnifiedCatalogItem[]> {
        if (!query.trim()) return [];

        try {
            // 1. Vectorize query once
            const embedding = await this.vectorizer.embedText(query);

            // 2. Conditional Parallel Search
            const searchPromises: Promise<any>[] = [];
            let priceBookIndex = -1;
            let materialIndex = -1;

            if (domain === 'ALL' || domain === 'LABOR') {
                priceBookIndex = searchPromises.length;
                searchPromises.push(this.priceBookRepo.searchByVector(embedding, limitPerSource, 2024, context, query));
            }

            if (domain === 'ALL' || domain === 'MATERIAL') {
                materialIndex = searchPromises.length;
                searchPromises.push(this.materialRepo.searchByVector(embedding, limitPerSource));
            }

            const results = await Promise.all(searchPromises);

            const priceBookResults = priceBookIndex >= 0 ? results[priceBookIndex] : [];
            const materialResults = materialIndex >= 0 ? results[materialIndex] : [];

            // 3. Normalize & Merge
            const unifiedPriceBook: UnifiedCatalogItem[] = priceBookResults.map((item: any) => ({
                id: item.code, // Code is the ID for PriceBook
                type: 'LABOR',
                code: item.code,
                name: item.description.substring(0, 100) + (item.description.length > 100 ? '...' : ''), // Shorten if needed or use full
                description: item.description,
                price: item.priceTotal,
                unit: item.unit,
                originalItem: item,
                score: item.matchScore || 0
            }));

            const unifiedMaterials: UnifiedCatalogItem[] = materialResults.map((item: any) => ({
                id: item.sku,
                type: 'MATERIAL',
                code: item.sku,
                name: item.name,
                description: item.description,
                price: item.price,
                unit: item.unit,
                originalItem: item,
                score: item.matchScore || 0
            }));

            // 4. Return combined (could be interleaved by score if available, for now just concatenated)
            return [...unifiedPriceBook, ...unifiedMaterials].sort((a, b) => (b.score || 0) - (a.score || 0));

        } catch (error) {
            console.error('[CatalogSearchService] Error searching:', error);
            return [];
        }
    }
}
