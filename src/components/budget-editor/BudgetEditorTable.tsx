'use client';

import React, { useState, useTransition } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    GripVertical,
    MoreHorizontal,
    Package,
    Hammer,
    Sparkles,
    Search,
    ListTree,
    Trash2,
    Copy,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    FolderPlus,
    Loader2
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditableBudgetLineItem } from "@/types/budget-editor";
import { EditableCell } from "./EditableCell";
import { sileo } from 'sileo';
import { estimatePriceAction, generateBreakdownAction } from '@/actions/budget/smart-actions';
import { BudgetBreakdownSheet } from './BudgetBreakdownSheet';

interface BudgetEditorTableProps {
    items: EditableBudgetLineItem[];
    chapters: string[];
    onReorder: (newItems: EditableBudgetLineItem[]) => void;
    onUpdate: (id: string, changes: Partial<EditableBudgetLineItem>) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    onAddChapter: (name: string) => void;
    onRemoveChapter: (name: string) => void;
    onRenameChapter: (oldName: string, newName: string) => void;
    onReorderChapters: (newOrder: string[]) => void;
    showGhostMode?: boolean;
}

const TableRowItem = ({ item, onUpdate, onRemove, onDuplicate, showGhostMode, onOpenBreakdown }: {
    item: EditableBudgetLineItem;
    onUpdate: (id: string, changes: Partial<EditableBudgetLineItem>) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    showGhostMode?: boolean;
    onOpenBreakdown: (item: EditableBudgetLineItem) => void;
}) => {
    const controls = useDragControls();
    const [isPending, startTransition] = useTransition();

    // Deviation Analysis
    const currentPrice = item.item?.unitPrice || 0;
    const originalPrice = item.originalState?.unitPrice || currentPrice;
    const deviation = originalPrice > 0 ? Math.abs((currentPrice - originalPrice) / originalPrice) : 0;
    const isDeviated = deviation > 0.2;

    const handleTotalChange = (val: string | number) => {
        const newTotal = Number(val);
        const quantity = item.item?.quantity || 1;
        const newUnitPrice = newTotal / (quantity === 0 ? 1 : quantity);
        onUpdate(item.id, { item: { ...item.item!, unitPrice: newUnitPrice } });
    };

    const handleEstimatePrice = () => {
        if (!item.originalTask) return;

        // Fix: sileo.loading is not a function, use sileo.show with unique ID to dismiss later if needed
        sileo.show({
            title: "Estimando precio...",
            description: "Consultando bases de datos de mercado con IA.",
            icon: <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        });

        startTransition(async () => {
            const result = await estimatePriceAction(item.originalTask!);
            if (result.success && result.price) {
                onUpdate(item.id, {
                    item: { ...item.item!, unitPrice: result.price, totalPrice: result.price * (item.item?.quantity || 1) },
                    isDirty: true
                });
                sileo.success({ title: "Precio Estimado", description: `Referencia: ${result.price}€ (${result.reason})` });
            } else {
                sileo.error({ title: "Error", description: "No se pudo estimar el precio." });
            }
        });
    };

    const handleGenerateBreakdown = () => {
        if (!item.originalTask) return;

        sileo.show({
            title: "Generando descompuesto...",
            description: "La IA está analizando la partida.",
            icon: <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        });

        startTransition(async () => {
            const result = await generateBreakdownAction(item.originalTask!);
            if (result.success && result.items && result.items.length > 0) {
                const match = result.items[0];

                onUpdate(item.id, {
                    item: {
                        ...item.item!,
                        unitPrice: match.unitPrice,
                        description: match.description,
                        unit: match.unit || item.item?.unit || 'ud',
                        code: match.code,
                        totalPrice: match.unitPrice * (item.item?.quantity || 1),
                        breakdown: match.breakdown
                    },
                    isDirty: true
                });
                sileo.success({ title: "Descompuesto generado", description: `${result.items.length} elementos analizados.` });
            } else {
                sileo.error({ title: "Sin resultados", description: "No se pudo generar el descompuesto." });
            }
        });
    };

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            as="tr"
            dragListener={false}
            dragControls={controls}
            className={cn(
                "group hover:bg-slate-50 dark:hover:bg-white/5 hover:text-foreground transition-colors border-b border-slate-100 dark:border-white/5 data-[state=selected]:bg-slate-100",
                isDeviated && "bg-amber-50/30 dark:bg-amber-900/10",
                isPending && "opacity-50 pointer-events-none"
            )}
        >
            {/* Drag Handle */}
            <TableCell className="w-[40px] p-2 text-center text-slate-300 align-top">
                <div onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing flex justify-center mt-1.5">
                    <GripVertical className="w-4 h-4" />
                </div>
            </TableCell>

            {/* Type Icon */}
            <TableCell className="w-[50px] p-2 text-center align-top pt-3">
                {isPending ? (
                    <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-purple-500" /></div>
                ) : (
                    item.type === 'MATERIAL' ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto">
                                        <Package className="w-4 h-4" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Material</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center mx-auto">
                            <Hammer className="w-4 h-4" />
                        </div>
                    )
                )}
            </TableCell>

            {/* Code & Description - TEXTAREA for wrapping */}
            <TableCell className="p-2 min-w-[300px] align-top">
                <div className="flex flex-col gap-1">
                    <Textarea
                        value={item.originalTask || ""}
                        onChange={(e) => onUpdate(item.id, { originalTask: e.target.value })}
                        className="min-h-[24px] resize-y p-0 border-none shadow-none focus-visible:ring-0 bg-transparent text-sm font-medium leading-relaxed overflow-hidden"
                        placeholder="Descripción de la partida..."
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                    />
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-white/5 px-1 rounded">
                            {item.item?.code || "---"}
                        </span>
                        {/* Breakdown Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-[10px] text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300"
                            onClick={() => onOpenBreakdown(item)}
                        >
                            <ListTree className="w-3 h-3 mr-1" />
                            {item.item?.breakdown?.length ? 'Ver Descompuesto' : 'Sin descompuesto'}
                        </Button>

                        {isDeviated && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">
                                <AlertTriangle className="w-3 h-3" /> Desviación {Math.round(deviation * 100)}%
                            </span>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Unit */}
            <TableCell className="w-[80px] p-2 align-top pt-3">
                <EditableCell
                    value={item.item?.unit || 'ud'}
                    onChange={(val) => onUpdate(item.id, { item: { ...item.item!, unit: val as string } })}
                    className="text-center text-xs font-medium text-slate-500 bg-transparent border-transparent hover:bg-slate-100 focus:bg-white w-full"
                />
            </TableCell>

            {/* Quantity */}
            <TableCell className="w-[100px] p-2 text-right align-top pt-3">
                <EditableCell
                    value={item.item?.quantity || 0}
                    onChange={(val) => onUpdate(item.id, { item: { ...item.item!, quantity: Number(val) } })}
                    type="number"
                    className="text-right text-sm font-mono bg-transparent border-transparent hover:bg-slate-100 focus:bg-white w-full pr-2"
                />
            </TableCell>

            {/* Unit Price */}
            <TableCell className="w-[120px] p-2 text-right align-top pt-3">
                <div className="relative group/price">
                    <EditableCell
                        value={item.item?.unitPrice || 0}
                        onChange={(val) => onUpdate(item.id, { item: { ...item.item!, unitPrice: Number(val) } })}
                        type="currency"
                        className={cn(
                            "text-right text-sm font-mono bg-transparent border-transparent hover:bg-slate-100 focus:bg-white w-full pr-2",
                            item.item?.unitPrice === 0 && "text-red-500 font-bold"
                        )}
                    />
                    {showGhostMode && item.originalState && (
                        <div className="absolute -bottom-4 right-2 text-[10px] text-slate-400 line-through">
                            {item.originalState.unitPrice.toFixed(2)}€
                        </div>
                    )}
                </div>
            </TableCell>

            {/* Total Price */}
            <TableCell className="w-[120px] p-2 text-right font-bold text-slate-700 dark:text-white font-mono bg-slate-50/30 dark:bg-white/5 align-top pt-3">
                <EditableCell
                    value={item.item?.totalPrice || 0}
                    onChange={handleTotalChange}
                    type="currency"
                    className="text-right bg-transparent border-transparent w-full pr-2"
                />
            </TableCell>

            {/* Actions */}
            <TableCell className="w-[50px] p-2 text-center align-top pt-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Acciones IA</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleEstimatePrice} className="text-purple-600 focus:text-purple-700 focus:bg-purple-50 cursor-pointer">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generar precio
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGenerateBreakdown} className="text-purple-600 focus:text-purple-700 focus:bg-purple-50 cursor-pointer">
                            <ListTree className="w-4 h-4 mr-2" />
                            Generar descompuesto
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenBreakdown(item)}>
                            <Search className="w-4 h-4 mr-2" />
                            Ver Detalles
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => onDuplicate(item.id)} className="cursor-pointer">
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer" onClick={() => onRemove(item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </Reorder.Item>
    );
};

const ChapterSection = ({
    chapterName,
    items,
    onReorder,
    onUpdate,
    onRemove,
    onDuplicate,
    onRename,
    onDelete,
    showGhostMode,
    onOpenBreakdown
}: any) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(chapterName);

    const handleRenameSubmit = () => {
        if (nameDraft.trim() && nameDraft !== chapterName) {
            onRename(nameDraft.trim());
        }
        setIsEditingName(false);
    };

    const totalChapter = items.reduce((acc: number, i: any) => acc + (i.item?.totalPrice || 0), 0);

    return (
        <>
            {/* Chapter Header - In its own tbody to be valid */}
            <TableBody className="border-t border-slate-200 dark:border-white/10">
                <TableRow className="bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10">
                    <TableCell colSpan={8} className="p-0">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-slate-400"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </Button>

                                {isEditingName ? (
                                    <Input
                                        autoFocus
                                        value={nameDraft}
                                        onChange={(e) => setNameDraft(e.target.value)}
                                        onBlur={handleRenameSubmit}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                                        className="h-7 w-64 font-bold text-lg bg-white"
                                    />
                                ) : (
                                    <div
                                        className="font-bold text-lg text-slate-800 dark:text-white cursor-pointer hover:underline decoration-dashed underline-offset-4 flex items-center gap-3"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        {chapterName}
                                        <Badge variant="secondary" className="font-normal text-xs text-slate-500">
                                            {items.length} ítems
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-slate-700 dark:text-white">
                                    {totalChapter.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsEditingName(true)}>Renombrar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={onDelete}>Eliminar Capítulo</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            </TableBody>

            {/* Draggable Items - Reorder.Group acts as a tbody */}
            {isExpanded && (
                <Reorder.Group
                    as="tbody"
                    axis="y"
                    values={items}
                    onReorder={onReorder}
                    className="[&_tr]:border-b [&_tr]:border-slate-100 dark:[&_tr]:border-white/5"
                >
                    {items.map((item: any) => (
                        <TableRowItem
                            key={item.id}
                            item={item}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onDuplicate={onDuplicate}
                            showGhostMode={showGhostMode}
                            onOpenBreakdown={onOpenBreakdown}
                        />
                    ))}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-400 border-dashed border-b">
                                Arrastra partidas aquí o añade nuevas desde la biblioteca
                            </TableCell>
                        </TableRow>
                    )}
                </Reorder.Group>
            )}
        </>
    );
};

export function BudgetEditorTable({
    items,
    chapters,
    onReorder,
    onUpdate,
    onRemove,
    onDuplicate,
    onAddChapter,
    onRemoveChapter,
    onRenameChapter,
    showGhostMode
}: BudgetEditorTableProps) {
    const [breakdownItem, setBreakdownItem] = useState<EditableBudgetLineItem | null>(null);
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    const handleOpenBreakdown = (item: EditableBudgetLineItem) => {
        setBreakdownItem(item);
        setBreakdownOpen(true);
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-white/5 hover:bg-slate-50/50">
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="w-[50px] text-center">Tipo</TableHead>
                        <TableHead>Descripción / Código</TableHead>
                        <TableHead className="w-[80px] text-center">Ud</TableHead>
                        <TableHead className="w-[100px] text-right">Cant.</TableHead>
                        <TableHead className="w-[120px] text-right">Precio</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>

                {chapters.map((chapterName) => (
                    <ChapterSection
                        key={chapterName}
                        chapterName={chapterName}
                        items={items.filter(i => i.chapter === chapterName)}
                        onReorder={onReorder}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onDuplicate={onDuplicate}
                        onRename={(newName: string) => onRenameChapter(chapterName, newName)}
                        onDelete={() => onRemoveChapter(chapterName)}
                        showGhostMode={showGhostMode}
                        onOpenBreakdown={handleOpenBreakdown}
                    />
                ))}
            </Table>

            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10">
                <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => onAddChapter(`Capítulo ${chapters.length + 1}`)}
                >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Nuevo Capítulo
                </Button>
            </div>

            <BudgetBreakdownSheet
                item={breakdownItem}
                open={breakdownOpen}
                onOpenChange={setBreakdownOpen}
            />
        </div>
    );
}
