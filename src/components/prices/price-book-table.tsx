
'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { getPriceBookItems } from '@/actions/price-book/get-price-book-items.action';

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

import { searchPriceBookAction } from '@/actions/price-book/search-price-book.action';

export function PriceBookTable({ year, searchQuery }: { year: number, searchQuery?: string }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0 });

    const fetchItems = async () => {
        try {
            setLoading(true);
            let result;

            if (searchQuery && searchQuery.trim().length > 2) {
                // Semantic Search
                result = await searchPriceBookAction(searchQuery, 20, year);
            } else {
                // Standard List
                result = await getPriceBookItems(year, 100);
            }

            if (result.success) {
                setItems(result.items || []);
                // If searching, we don't really have a 'total' count in the same way, but we can just ignore or set to items.length
                const total = searchQuery
                    ? (result.items?.length || 0)
                    : ((result as any).total || 0);
                setStats({ total });
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search if strictly needed, but manual trigger or short delay is fine for now
        const timer = setTimeout(() => {
            fetchItems();
        }, 500);
        return () => clearTimeout(timer);
    }, [year, searchQuery]);

    return (
        <Card className="w-full mt-8 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4">
                <div>
                    <CardTitle className="text-xl text-primary">Base de Precios ({year})</CardTitle>
                    <CardDescription>
                        Visualizando <span className="font-semibold text-foreground">{items.length}</span> partidas recientes.
                        Total estimado: <span className="font-semibold text-foreground">{stats.total}</span>
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refrescar Datos
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="border-t">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[100px] font-bold">Código</TableHead>
                                <TableHead className="w-[80px] font-bold">Unidad</TableHead>
                                <TableHead className="font-bold">Descripción</TableHead>
                                <TableHead className="text-right font-bold w-[120px]">Precio (€)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-xs text-muted-foreground">Cargando partidas...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : items.length > 0 ? (
                                items.map((item) => (
                                    <TableRow key={item.id || item.code} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-mono font-medium text-primary">
                                            {item.code}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {item.unit}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[400px]">
                                            <div className="truncate text-sm text-foreground/80" title={item.description}>
                                                {item.description}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.priceTotal || item.price)}
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 font-mono text-xl">
                                                            <span>{item.code}</span>
                                                            <Badge variant="outline">{item.unit}</Badge>
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Detalle completo de la partida
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4 space-y-4">
                                                        <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                                            {item.description}
                                                        </div>
                                                        <div className="flex justify-end items-center gap-2 text-lg font-bold">
                                                            <span>Precio:</span>
                                                            <span className="text-primary">
                                                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.priceTotal || item.price)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No se encontraron datos. Sube un PDF para comenzar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
