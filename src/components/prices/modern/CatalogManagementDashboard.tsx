'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LatestMaterialsList } from './LatestMaterialsList';
import { SearchMaterialParams } from '@/components/prices/modern/SearchMaterialParams';
import { Package } from 'lucide-react';

export function CatalogManagementDashboard() {
    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Materiales</h1>
                        <p className="text-muted-foreground">
                            Gestión y consulta de productos ingestados (Obramat). Utiliza la búsqueda semántica para encontrar materiales.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Buscador Semántico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SearchMaterialParams />
                    </CardContent>
                </Card>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 gap-8">
                <LatestMaterialsList />
            </div>
        </div>
    );
}
