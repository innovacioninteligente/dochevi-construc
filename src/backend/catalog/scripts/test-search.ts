
import * as dotenv from 'dotenv';
dotenv.config();

import { CatalogSearchService } from '../application/catalog-search.service';

async function main() {
    const service = new CatalogSearchService();
    const query = process.argv[2] || 'parquet nogal';

    console.log(`Searching for: "${query}"...`);

    const results = await service.search(query);

    console.log(`Found ${results.length} results.`);
    console.log('--- LABOR ITEMS ---');
    results.filter(r => r.type === 'LABOR').forEach(r => {
        console.log(`[${r.code}] ${r.name} - ${r.price}€`);
    });

    console.log('\n--- MATERIAL ITEMS ---');
    results.filter(r => r.type === 'MATERIAL').forEach(r => {
        console.log(`[${r.code}] ${r.name} - ${r.price}€`);
    });
}

main().catch(console.error);
