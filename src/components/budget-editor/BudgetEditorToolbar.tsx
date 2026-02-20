'use client';

import { Button } from '@/components/ui/button';
import {
    Save,
    Undo2,
    Redo2,
    FileDown,
    Loader2,
    Check,
    ScanEye,
    MoreVertical,
    Plus,
    History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BudgetDocument } from '@/components/pdf/BudgetDocument';
import { EditableBudgetLineItem } from '@/types/budget-editor';
import { BudgetCostBreakdown } from '@/backend/budget/domain/budget';
import React from 'react';
import { MaterialCatalogSearch } from './material-catalog-search';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { SemanticCatalogSidebar } from './SemanticCatalogSidebar';

interface BudgetEditorToolbarProps {
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    lastSavedAt?: Date;

    // Comparison Mode
    showGhostMode: boolean;
    onToggleGhostMode: () => void;

    // For PDF Generation
    clientName: string;
    items: EditableBudgetLineItem[];
    costBreakdown: BudgetCostBreakdown;
    budgetNumber: string;
    onAddItem: (item: any) => void;
}

export const BudgetEditorToolbar = ({
    hasUnsavedChanges,
    isSaving,
    canUndo,
    canRedo,
    onSave,
    onUndo,
    onRedo,
    lastSavedAt,
    showGhostMode,
    onToggleGhostMode,
    clientName,
    items,
    costBreakdown,
    budgetNumber,
    onAddItem
}: BudgetEditorToolbarProps) => {
    // Determine status text
    const statusText = isSaving ? 'Guardando...' :
        hasUnsavedChanges ? 'Cambios sin guardar' :
            lastSavedAt ? `Guardado ${lastSavedAt.toLocaleTimeString()}` : 'Listo';

    const StatusBadge = () => (
        <span className={cn(
            "text-[10px] md:text-xs font-medium px-2 md:px-2.5 py-0.5 md:py-1 rounded-full transition-colors border truncate max-w-[120px]",
            hasUnsavedChanges
                ? "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
        )}>
            {statusText}
        </span>
    );

    return (
        <>
            {/* TOP TOOLBAR (Adaptive) */}
            <div className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-border px-4 py-3 flex justify-between items-center shadow-sm">

                {/* LEFT: Status Indicator "Listo" */}
                <div className="flex items-center gap-4">
                    <StatusBadge />
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-2">
                    {/* Library Button (Dialog) */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="hidden md:flex bg-white hover:bg-slate-50 border-slate-200 text-slate-700 gap-2">
                                <BookOpen className="w-4 h-4" />
                                Biblioteca
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Biblioteca de Precios
                                </h2>
                            </div>
                            <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
                                <SemanticCatalogSidebar onAddItem={(item) => {
                                    onAddItem(item);
                                    // Optional: Close dialog or show toast
                                }} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Compare Button */}
                    <Button
                        variant={showGhostMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={onToggleGhostMode}
                        className={cn(
                            "hidden md:flex bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
                            showGhostMode && "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}
                    >
                        <ScanEye className="w-4 h-4 mr-2" />
                        Comparar
                    </Button>

                    {/* PDF Export */}
                    <PDFDownloadLink
                        document={
                            <BudgetDocument
                                budgetNumber={budgetNumber}
                                clientName={clientName}
                                clientEmail=""
                                clientAddress=""
                                items={items}
                                costBreakdown={costBreakdown}
                                date={new Date().toLocaleDateString()}
                            />
                        }
                        fileName={`Presupuesto-${budgetNumber}.pdf`}
                    >
                        {({ loading }) => (
                            <Button variant="outline" size="sm" disabled={loading} className="hidden md:flex bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                                Exportar PDF
                            </Button>
                        )}
                    </PDFDownloadLink>

                    {/* Save Button (Primary Action) */}
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        size="sm"
                        className={cn(
                            "min-w-[100px] shadow-sm transition-all font-medium",
                            hasUnsavedChanges
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900"
                        )}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (hasUnsavedChanges ? <Save className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />)}
                        {isSaving ? 'Guardando' : 'Guardar'}
                    </Button>
                </div>
            </div>

            {/* MOBILE STICKY BOTTOM BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-border z-50 flex gap-3 safe-area-pb">
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    size="lg"
                    className={cn(
                        "flex-1 shadow-lg transition-all font-semibold",
                        hasUnsavedChanges
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                            : "bg-primary text-primary-foreground"
                    )}
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (hasUnsavedChanges ? <Save className="w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />)}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </>
    );
};
