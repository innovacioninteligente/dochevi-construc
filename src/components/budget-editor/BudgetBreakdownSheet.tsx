import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EditableBudgetLineItem } from "@/types/budget-editor";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Hammer, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BudgetBreakdownSheetProps {
    item: EditableBudgetLineItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BudgetBreakdownSheet({ item, open, onOpenChange }: BudgetBreakdownSheetProps) {
    if (!item) return null;

    const breakdown = item.item?.breakdown || [];
    const hasBreakdown = breakdown.length > 0;

    // Calculate total from breakdown to compare
    const breakdownTotal = breakdown.reduce((acc, comp) => acc + (comp.total || (comp.price * (comp.yield || 1))), 0);
    const itemTotal = item.item?.unitPrice || 0;
    const deviation = Math.abs(breakdownTotal - itemTotal);
    const isDeviated = deviation > 0.05; // 5 cents tolerance

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 gap-0 flex flex-col">
                {/* Header Style "Top 0" - Full Width */}
                <div className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-white/10 p-6 pb-4">
                    <SheetHeader className="text-left space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-xs font-bold text-slate-500">{item.item?.code || 'SIN CÓDIGO'}</span>
                                    <span className="text-slate-300">•</span>
                                    {item.type === 'MATERIAL' ? (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1 py-0 h-5">MATERIAL</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 text-slate-500">PARTIDA</Badge>
                                    )}
                                </div>
                                <SheetTitle className="text-xl font-bold leading-tight">
                                    {item.originalTask || item.item?.description}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-slate-500 line-clamp-2">
                                    {item.item?.description !== item.originalTask ? item.item?.description : ''}
                                </SheetDescription>
                            </div>


                        </div>

                        {/* Summary Cards */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Precio Unitario</span>
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {(item.item?.unitPrice || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    <span className="text-sm font-normal text-slate-400 ml-1">/ {item.item?.unit}</span>
                                </span>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Breakdown Table */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                            Descompuesto (Cost Breakdown)
                        </h3>

                        {hasBreakdown ? (
                            <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-white/10">
                                <Table>
                                    <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5">
                                            <TableHead className="w-[100px] text-xs font-bold text-slate-700 dark:text-slate-300">CÓDIGO</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">DESCRIPCIÓN</TableHead>
                                            <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300 w-[80px]">CANT.</TableHead>
                                            <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300 w-[80px]">PRECIO</TableHead>
                                            <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300 w-[80px]">TOTAL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {breakdown.map((comp, idx) => {
                                            // Fallback calculations
                                            const computedTotal = comp.total || (comp.price * (comp.yield || 1));
                                            const computedYield = comp.yield || 1;
                                            // Check if it looks like a code (e.g. A0701...)
                                            // The 'concept' might contain the code if incorrectly parsed, but if we have 'code' prop use it
                                            return (
                                                <TableRow key={idx} className="border-slate-50 dark:border-white/5 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 font-mono text-xs font-medium text-amber-600 dark:text-amber-500">
                                                        {comp.code || '---'}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-300">
                                                        {comp.concept}
                                                        {comp.waste ? <span className="text-[10px] text-amber-600 ml-1 bg-amber-50 px-1 rounded">Merma {comp.waste * 100}%</span> : null}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                                                        {computedYield.toFixed(3)} {item.item?.unit === 'u' && comp.yield && comp.yield > 10 ? 'ml' : ''}
                                                        {/* Unit inference is tricky without explicit unit in breakdown component, assumed mostly same or derived */}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                                                        {comp.price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                                                        {computedTotal.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        <TableRow className="bg-slate-50/50 dark:bg-white/5 border-t-2 border-slate-100 dark:border-white/10">
                                            <TableCell colSpan={4} className="text-right py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">SUMA DE COSTES</TableCell>
                                            <TableCell className="text-right py-3 text-sm font-bold text-neutral-900 dark:text-white">
                                                {breakdownTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Hammer className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500 font-medium">Sin desglose disponible</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Esta partida no tiene elementos asociados.</p>
                            </div>
                        )}

                        {isDeviated && hasBreakdown && (
                            <div className="mt-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-500">Desviación del {Math.round(deviation / itemTotal * 100)}%</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-600 leading-relaxed">
                                        El precio unitario manual ({itemTotal.toFixed(2)}€) no coincide con la suma de los costes ({breakdownTotal.toFixed(2)}€).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
