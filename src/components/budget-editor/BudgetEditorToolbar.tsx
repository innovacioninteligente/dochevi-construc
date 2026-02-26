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
// BudgetPDFDocument and pdf() are imported dynamically inside handleGeneratePdf to avoid SSR hydration errors
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { SemanticCatalogSidebar } from './SemanticCatalogSidebar';
import { AssignLeadDialog } from './AssignLeadDialog';
import { PersonalInfo } from '@/backend/lead/domain/lead';

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

    // Lead assignment
    currentLeadId?: string;
    currentClientName?: string;
    onAssignLead?: (leadId: string, clientSnapshot: PersonalInfo) => Promise<void>;
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
    onAddItem,
    currentLeadId,
    currentClientName,
    onAssignLead
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

    const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const [pdfGenerationStep, setPdfGenerationStep] = React.useState<string | null>(null);

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        setPdfGenerationStep("Preparando modelo de datos matemáticos...");
        try {
            // Give React a tick to update the UI "Generating..." state before freezing the main thread
            await new Promise(resolve => setTimeout(resolve, 100));

            setPdfGenerationStep("Montando el renderizador de páginas vectoriales...");
            await new Promise(resolve => setTimeout(resolve, 100));

            // Dynamic import to avoid SSR hydration errors
            const { pdf } = await import('@react-pdf/renderer');
            const { BudgetPDFDocument } = await import('./pdf/BudgetPDFDocument');

            const docElement = (
                <BudgetPDFDocument
                    data={{
                        projectName: `Presupuesto ${budgetNumber}`,
                        clientName: clientName || currentClientName || 'Cliente No Asignado',
                        date: new Date().toLocaleDateString('es-ES'),
                        items: items,
                        chapters: Array.from(new Set(items.map(i => i.chapter).filter(Boolean) as string[])),
                        costBreakdown: costBreakdown
                    }}
                />
            );

            setPdfGenerationStep("Compilando arquitectura del archivo PDF (este paso toma unos segundos)...");
            const asPdf = pdf();
            asPdf.updateContainer(docElement);
            // .toBlob() is the heaviest calculation and will occupy the thread
            const blob = await asPdf.toBlob();

            setPdfGenerationStep("¡Completado! Lanzando la descarga segura...");
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create a fake URL and click it
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Presupuesto-${budgetNumber}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            setIsPdfModalOpen(false);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally add a toast here if configured
        } finally {
            setIsGeneratingPdf(false);
            setPdfGenerationStep(null);
        }
    };

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
                    {/* Assign Lead Button */}
                    {onAssignLead && (
                        <AssignLeadDialog
                            currentLeadId={currentLeadId}
                            currentClientName={currentClientName}
                            onAssignLead={onAssignLead}
                        />
                    )}

                    {/* Library Button (Dialog) */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="hidden md:flex bg-white hover:bg-slate-50 border-slate-200 text-slate-700 gap-2">
                                <BookOpen className="w-4 h-4" />
                                Biblioteca
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                            <DialogHeader className="p-4 border-b pb-4">
                                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Biblioteca de Precios
                                </DialogTitle>
                            </DialogHeader>
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

                    {/* PDF Export (Lazy Modal) */}
                    <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden md:flex bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                                <FileDown className="w-4 h-4 mr-2" />
                                Exportar PDF
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Generando Documento PDF</DialogTitle>
                                <DialogDescription>
                                    Este proceso puede tardar unos segundos dependiendo del tamaño del presupuesto.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-lg border border-slate-100 mt-2 text-center">
                                <FileDown className="w-12 h-12 text-slate-300 mx-auto" />
                                <Button
                                    onClick={handleGeneratePdf}
                                    disabled={isGeneratingPdf}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isGeneratingPdf ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando Presupuesto...</>
                                    ) : (
                                        <><FileDown className="w-4 h-4 mr-2" /> Descargar Presupuesto Ahora</>
                                    )}
                                </Button>
                                {isGeneratingPdf && pdfGenerationStep && (
                                    <div className="text-xs font-mono text-slate-500 animate-pulse mt-2 p-2 bg-slate-100 rounded text-center">
                                        &gt;_ {pdfGenerationStep}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

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
