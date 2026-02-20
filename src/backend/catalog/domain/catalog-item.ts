
import { PriceBookItem } from '@/backend/price-book/domain/price-book-item';
import { MaterialItem } from '@/backend/material-catalog/domain/material-item';

export type CatalogItemType = 'LABOR' | 'MATERIAL';

export interface UnifiedCatalogItem {
    id: string;
    type: CatalogItemType;
    /**
     * Unique identifier (code for LABOR, sku for MATERIAL)
     */
    code: string;
    /**
     * Short display name (description for LABOR, name for MATERIAL)
     */
    name: string;
    /**
     * Full description
     */
    description: string;
    price: number;
    unit: string;
    /**
     * The original domain object
     */
    originalItem: PriceBookItem | MaterialItem;
    /**
     * Search relevance score (if available)
     */
    score?: number;
}
