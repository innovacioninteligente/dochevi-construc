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
import { formatMoneyEUR } from '@/lib/utils';

interface SemanticCatalogSidebarProps {
    onAddItem: (item: Partial<EditableBudgetLineItem>) => void;
    defaultTab?: 'ALL' | 'LABOR' | 'MATERIAL';
}

export const SemanticCatalogSidebar = ({ onAddItem, defaultTab = 'ALL' }: SemanticCatalogSidebarProps) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'LABOR' | 'MATERIAL'>(defaultTab);
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
                        filteredItems.map((item, idx) => (
                            <div
                                key={item.id || item.code || idx}
                                className="group flex flex-col gap-2 p-3 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-100 dark:hover:border-white/5 transition-all cursor-default"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 h-4 border-none rounded-sm ${item.type === 'LABOR'
                                                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
                                                }`}>
                                                {item.type === 'LABOR' ? <Hammer className="w-2.5 h-2.5 mr-1" /> : <ShoppingCart className="w-2.5 h-2.5 mr-1" />}
                                                {item.type === 'LABOR' ? 'PARTIDA' : 'MATERIAL'}
                                            </Badge>
                                        </div>
                                        <h4 className="font-sans font-medium text-[13px] text-slate-800 dark:text-slate-200 leading-snug line-clamp-2" title={item.description}>
                                            {item.name}
                                        </h4>
                                    </div>
                                    <span className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white justify-end flex shrink-0">
                                        {formatMoneyEUR(item.price)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-slate-400 dark:text-white/30 font-mono truncate max-w-[120px]">
                                        {item.code} • {item.unit}
                                    </span>
                                    <Button
                                        size="sm"
                                        className="h-6 text-[10px] uppercase font-semibold tracking-wider px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
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
