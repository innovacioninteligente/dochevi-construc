'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Package, Loader2, Hammer, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedCatalogItem } from '@/backend/catalog/domain/catalog-item';
import { searchCatalogAction } from '@/actions/catalog/search-catalog.action';
import { useToast } from '@/hooks/use-toast';
import { EditableBudgetLineItem } from '@/types/budget-editor';

interface SemanticCatalogSidebarProps {
    onAddItem: (item: Partial<EditableBudgetLineItem>) => void;
}

export const SemanticCatalogSidebar = ({ onAddItem }: SemanticCatalogSidebarProps) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'LABOR' | 'MATERIAL'>('ALL');
    const [items, setItems] = useState<UnifiedCatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.trim().length > 2) {
                setIsLoading(true);
                try {
                    const results = await searchCatalogAction(search);
                    setItems(results);
                } catch (error) {
                    console.error("Search error", error);
                    toast({
                        title: "Error",
                        description: "No se pudieron cargar los resultados.",
                        variant: "destructive"
                    });
                } finally {
                    setIsLoading(false);
                }
            } else if (search.trim().length === 0) {
                setItems([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, toast]);

    const filteredItems = items.filter(item => {
        if (activeTab === 'ALL') return true;
        return item.type === activeTab;
    });

    const handleAdd = (item: UnifiedCatalogItem) => {
        // Map UnifiedCatalogItem to EditableBudgetLineItem
        const newItem: Partial<EditableBudgetLineItem> = {
            originalTask: item.name,
            chapter: item.type === 'LABOR' ? 'General' : 'Materiales',
            item: {
                code: item.code,
                description: item.description,
                unit: item.unit,
                quantity: 1,
                unitPrice: item.price,
                totalPrice: item.price
            },
            originalState: {
                unitPrice: item.price,
                quantity: 1,
                description: item.description,
                unit: item.unit
            }
        };

        onAddItem(newItem);
        toast({
            title: item.type === 'LABOR' ? "Partida añadida" : "Material añadido",
            description: `${item.code} se ha añadido al presupuesto.`,
        });
    };

    return (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary dark:text-primary/90" />
                        Catálogo Unificado
                    </h3>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                    <Input
                        placeholder="Buscar partida o material..."
                        className="pl-9 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-2.5">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="ALL" className="text-xs">Todo</TabsTrigger>
                        <TabsTrigger value="LABOR" className="text-xs">Partidas</TabsTrigger>
                        <TabsTrigger value="MATERIAL" className="text-xs">Materiales</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <ScrollArea className="flex-1 p-0">
                <div className="p-2 space-y-1">
                    {items.length === 0 && !isLoading ? (
                        <div className="text-center py-8 text-slate-400 dark:text-white/40 text-sm px-4">
                            {search.length > 0 && search.length < 3
                                ? "Escribe al menos 3 caracteres..."
                                : "Busca partidas de obra o materiales de construcción."}
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col gap-2 p-3 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-100 dark:hover:border-white/5 transition-all cursor-default"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${item.type === 'LABOR'
                                                    ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                    : 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                                }`}>
                                                {item.type === 'LABOR' ? <Hammer className="w-3 h-3 mr-1" /> : <ShoppingCart className="w-3 h-3 mr-1" />}
                                                {item.type === 'LABOR' ? 'Partida' : 'Material'}
                                            </Badge>
                                        </div>
                                        <h4 className="font-medium text-sm text-slate-700 dark:text-white leading-tight line-clamp-2" title={item.description}>
                                            {item.name}
                                        </h4>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-white/90 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                        {item.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-slate-400 dark:text-white/30 font-mono truncate max-w-[120px]">
                                        {item.code} • {item.unit}
                                    </span>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleAdd(item)}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Añadir
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
