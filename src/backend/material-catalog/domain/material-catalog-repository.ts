
import { MaterialItem } from './material-item';

export interface MaterialCatalogRepository {
    findById(id: string): Promise<MaterialItem | null>;
    findBySku(sku: string): Promise<MaterialItem | null>;
    save(item: MaterialItem): Promise<void>;
    saveBatch(items: MaterialItem[]): Promise<void>;
    searchByVector(vector: number[], limit: number): Promise<MaterialItem[]>;
    searchByText(query: string, limit: number): Promise<MaterialItem[]>;
    findByPage(page: number, year: number): Promise<MaterialItem[]>;
    deleteByYear(year: number): Promise<number>;
}
