import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SemanticCatalogSidebar } from "./SemanticCatalogSidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatMoneyEUR } from "@/lib/utils";
import { EditableBudgetLineItem }
    from "@/types/budget-editor";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Hammer, Package, AlertTriangle, ChevronDown, ChevronUp, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BudgetBreakdownSheetProps {
    item: EditableBudgetLineItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwapMatch?: (itemToSwap: EditableBudgetLineItem, newMatch: any) => void;
    onAddMaterial?: (itemTarget: EditableBudgetLineItem, materialToAdd: any) => void;
}

export function BudgetBreakdownSheet({ item, open, onOpenChange, onSwapMatch, onAddMaterial }: BudgetBreakdownSheetProps) {
    const [expandedCandidateIdx, setExpandedCandidateIdx] = useState<number | null>(null);
    const [isMaterialSearchOpen, setIsMaterialSearchOpen] = useState(false);

    if (!item) return null;

    const breakdown = item.item?.breakdown || [];
    const hasBreakdown = breakdown && breakdown.length > 0;

    // Calculate
    const breakdownTotal = breakdown.reduce((acc, comp) => {
        const y = comp.quantity ?? comp.yield ?? 1;
        const isPct = comp.unit === '%' || comp.code === '%';
        const t = comp.total ?? (isPct ? (comp.price * (y / 100)) : (comp.price * y));
        return acc + t;
    }, 0);
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
                                <SheetTitle className="text-sm font-semibold leading-relaxed tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl">
                                    {item.originalTask || item.item?.description}
                                </SheetTitle>
                                {item.item?.description !== item.originalTask && (
                                    <SheetDescription className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                                        " {item.item?.description} "
                                    </SheetDescription>
                                )}
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="flex items-center gap-8 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Precio Unitario</span>
                                <span className="text-2xl font-light tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {formatMoneyEUR(item.item?.unitPrice || 0)}
                                    <span className="text-xs font-normal text-slate-400">/ {item.item?.unit}</span>
                                </span>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Medición Total</span>
                                <span className="text-2xl font-light tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {item.item?.quantity?.toFixed(2) || 0}
                                    <span className="text-xs font-normal text-slate-400"> {item.item?.unit}</span>
                                </span>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-800 dark:text-slate-300 font-bold mb-1">Total Partida</span>
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {formatMoneyEUR((item.item?.unitPrice || 0) * (item.item?.quantity || 0))}
                                </span>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Breakdown Table */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                Descompuesto (Cost Breakdown)
                            </h3>
                            {onAddMaterial && (
                                <Dialog open={isMaterialSearchOpen} onOpenChange={setIsMaterialSearchOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-none border-slate-200">
                                            <Plus className="w-3 h-3 mr-1" />
                                            Añadir Material
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                                        <DialogHeader className="p-4 border-b pb-4 bg-slate-50/50">
                                            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                                <Package className="w-5 h-5 text-indigo-500" />
                                                Buscador de Materiales
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
                                            <SemanticCatalogSidebar
                                                defaultTab="MATERIAL"
                                                onAddItem={(material) => {
                                                    onAddMaterial(item, material);
                                                    setIsMaterialSearchOpen(false);
                                                }}
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {item.item?.matchedItem && (
                            <div className="mb-6 p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] uppercase font-bold tracking-wider">
                                        MATCH BASE DE DATOS IA
                                    </Badge>
                                    <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-400">
                                        {item.item.matchedItem.code}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    {item.item.matchedItem.description}
                                </p>
                            </div>
                        )}

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
                                            // Fallback calculations: prefer quantity, fallback to yield, then 1
                                            const computedYield = comp.quantity ?? comp.yield ?? 1;
                                            const isPct = comp.unit === '%' || comp.code === '%';
                                            const computedTotal = comp.total ?? (isPct ? (comp.price * (computedYield / 100)) : (comp.price * computedYield));
                                            // Check if it looks like a code (e.g. A0701...)
                                            // The 'concept' might contain the code if incorrectly parsed, but if we have 'code' prop use it
                                            return (
                                                <TableRow key={idx} className="border-slate-50 dark:border-white/5 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 font-mono text-xs font-medium text-amber-600 dark:text-amber-500">
                                                        {comp.code || '---'}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-300">
                                                        {comp.description || comp.concept}
                                                        {comp.waste ? <span className="text-[10px] text-amber-600 ml-1 bg-amber-50 px-1 rounded">Merma {comp.waste * 100}%</span> : null}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                                                        {computedYield.toFixed(3)} {item.item?.unit === 'u' && comp.yield && comp.yield > 10 ? 'ml' : ''}
                                                        {/* Unit inference is tricky without explicit unit in breakdown component, assumed mostly same or derived */}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                                                        {formatMoneyEUR(comp.price)}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                                                        {formatMoneyEUR(computedTotal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        <TableRow className="bg-slate-50/50 dark:bg-white/5 border-t-2 border-slate-100 dark:border-white/10">
                                            <TableCell colSpan={4} className="text-right py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">SUMA DE COSTES</TableCell>
                                            <TableCell className="text-right py-3 text-sm font-bold text-neutral-900 dark:text-white">
                                                {formatMoneyEUR(breakdownTotal)}
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
                                        El precio unitario manual ({formatMoneyEUR(itemTotal)}) no coincide con la suma de los costes ({formatMoneyEUR(breakdownTotal)}).
                                    </p>
                                </div>
                            </div>
                        )}

                        {item.item?.candidates && item.item.candidates.length > 1 && (
                            <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                    Candidatos Alternativos (IA)
                                </h3>
                                <div className="space-y-3">
                                    {item.item.candidates.filter((c: any) => c.code && c.code !== item.item?.matchedItem?.code).map((candidate: any, idx: number) => {
                                        const isExpanded = expandedCandidateIdx === idx;

                                        return (
                                            <div key={idx} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 p-4 rounded-lg flex flex-col gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{candidate.code}</span>
                                                            <Badge variant="outline" className="text-[10px] h-5">{formatMoneyEUR(candidate.price)} / {candidate.unit}</Badge>
                                                            {candidate.type === 'MATERIAL' && <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[9px] h-4 px-1 py-0 rounded">MATERIAL</Badge>}
                                                        </div>
                                                        <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`} title={candidate.description}>
                                                            {candidate.description}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="shrink-0 text-xs shadow-none bg-slate-100 hover:bg-slate-200 border-none text-slate-900 dark:bg-zinc-700/50 dark:text-slate-200 dark:hover:bg-zinc-700"
                                                        onClick={() => onSwapMatch?.(item, candidate)}
                                                    >
                                                        Usar Partida
                                                    </Button>
                                                </div>

                                                {candidate.breakdown && candidate.breakdown.length > 0 && (
                                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                                        <button
                                                            onClick={() => setExpandedCandidateIdx(isExpanded ? null : idx)}
                                                            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                        >
                                                            <Layers className="w-3.5 h-3.5" />
                                                            {isExpanded ? 'Ocultar Descompuesto' : `Ver Descompuesto (${candidate.breakdown.length} elems)`}
                                                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="mt-3 bg-slate-50 dark:bg-black/20 p-3 rounded-md border border-slate-100 dark:border-white/5 space-y-2">
                                                                {candidate.breakdown.map((bComp: any, bIdx: number) => {
                                                                    const yieldVal = bComp.quantity ?? bComp.yield ?? 1;
                                                                    return (
                                                                        <div key={bIdx} className="flex items-start justify-between gap-3 text-xs">
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-mono text-[10px] text-slate-400">{bComp.code}</p>
                                                                                <p className="text-slate-600 dark:text-slate-300 truncate">{bComp.description || bComp.concept}</p>
                                                                            </div>
                                                                            <div className="flex flex-col items-end shrink-0">
                                                                                <span className="font-mono text-slate-500">{yieldVal.toFixed(2)} x {formatMoneyEUR(bComp.price)}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
