
'use client';

import { useState } from 'react';
import { PriceBookTable } from '@/components/prices/price-book-table';
import { PriceBookUploader } from './price-book-uploader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function PriceBookAdminView({ locale }: { locale: string }) {
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [refreshKey, setRefreshKey] = useState(0);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const handleSearch = () => {
        setSearchQuery(searchInput);
    };

    const handleUploadComplete = () => {
        setRefreshKey(prev => prev + 1);
        setIsUploadOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Administración de Precios</h1>
                    <p className="text-muted-foreground">Gestiona la base de conocimiento de precios para la IA.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar partida (ej: demoler...)"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleSearch} disabled={searchInput.trim().length === 0}>
                            Buscar
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Año:</span>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="border rounded px-2 py-1 w-20 text-center"
                        />
                    </div>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <PlusCircle className="w-4 h-4" />
                                Subir Nuevo Libro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Subir Libro de Precios</DialogTitle>
                                <DialogDescription>
                                    Carga un PDF (formato Preoc o similar) para que la IA extraiga las partidas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                <PriceBookUploader locale={locale} onUploadComplete={handleUploadComplete} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <PriceBookTable year={year} searchQuery={searchQuery} key={refreshKey} />
        </div>
    );
}
