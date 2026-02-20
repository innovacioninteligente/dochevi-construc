
import { MaterialCatalogRepository } from '../domain/material-catalog-repository';

export class DeleteMaterialService {
    constructor(
        private repository: MaterialCatalogRepository
    ) { }

    async deleteCatalogByYear(year: number): Promise<{ success: boolean, deletedCount: number }> {
        try {
            console.log(`[Service] Starting deletion for catalog year: ${year}...`);
            const deletedCount = await this.repository.deleteByYear(year);
            console.log(`[Service] Deletion complete. Removed ${deletedCount} items.`);
            return { success: true, deletedCount };
        } catch (error) {
            console.error(`[Service] Error deleting catalog for year ${year}:`, error);
            throw error;
        }
    }
}
