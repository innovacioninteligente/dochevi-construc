'use client';

import React from 'react';
import { useBudgetEditor } from '@/hooks/use-budget-editor';
import { BudgetEditorTable } from './BudgetEditorTable';
import { BudgetEditorToolbar } from './BudgetEditorToolbar';
import { updateBudgetAction } from '@/actions/budget/update-budget.action';
import { Budget } from '@/backend/budget/domain/budget';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetRequestDetails } from './BudgetRequestDetails';
import { BudgetEconomicSummary } from './BudgetEconomicSummary';
import { BudgetHealthWidget } from './BudgetHealthWidget';
import { SemanticCatalogSidebar } from './SemanticCatalogSidebar';
import { RenovationGallery } from '@/components/dream-renovator/RenovationGallery';
import { BudgetRequestViewer } from './BudgetRequestViewer';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AIThinkingTrace } from './AIThinkingTrace';
import { Menu, Sparkles, FileText, User, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BudgetEditorWrapperProps {
    budget: Budget;
    isAdmin?: boolean;
}

const BudgetEditorMain = ({ budget, isAdmin }: BudgetEditorWrapperProps) => {
    const {
        state,
        updateItem,
        addItem,
        reorderItems,
        removeItem,
        duplicateItem,
        undo,
        redo,
        saveStart,
        saveSuccess,
        saveError,
        canUndo,
        canRedo,
        addChapter,
        removeChapter,
        renameChapter,
        reorderChapters
    } = useBudgetEditor((budget as any).lineItems);

    const { toast } = useToast();
    const [isGhostMode, setIsGhostMode] = React.useState(false);

    // Helper for source
    const getSourceInfo = (source?: string) => {
        switch (source) {
            case 'wizard':
                return { icon: Sparkles, label: 'Asistente IA', color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-400' };
            case 'pdf_measurement':
                return { icon: FileText, label: 'Mediciones PDF', color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400' };
            default:
                return { icon: User, label: 'Manual', color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400' };
        }
    };

    const sourceInfo = getSourceInfo(budget.source);
    const SourceIcon = sourceInfo.icon;

    // Handle Save
    const handleSave = async () => {
        saveStart();

        // 1. Transform Editor State to Domain Model (Chapters)
        // We reconstruct the BudgetChapter[] structure from the flat State items by grouping by chapter name
        const domainChapters: any[] = state.chapters.map((chapterName, index) => {
            const chapterItems = state.items
                .filter(i => i.chapter === chapterName)
                .map((editorItem, itemIndex) => {
                    // Map Editor Item to Domain Item
                    // Ensure we persist ALL fields, including AI breakdown
                    return {
                        id: editorItem.id,
                        order: itemIndex + 1,
                        type: editorItem.type || 'PARTIDA',
                        // If it has a nested item source, use it, otherwise use root props
                        code: editorItem.item?.code || '',
                        description: editorItem.item?.description || editorItem.originalTask || '',
                        unit: editorItem.item?.unit || 'ud',
                        quantity: editorItem.item?.quantity || 1,
                        unitPrice: editorItem.item?.unitPrice || 0,
                        totalPrice: editorItem.item?.totalPrice || 0,

                        originalTask: editorItem.originalTask,
                        breakdown: editorItem.item?.breakdown, // <--- Key for AI Persistence
                        note: editorItem.item?.note,
                        isRealCost: editorItem.item?.isRealCost,
                        matchConfidence: editorItem.item?.matchConfidence
                    };
                });

            return {
                id: `chap-${index}-${Date.now()}`, // Generate acceptable ID or keep track if possible
                name: chapterName,
                order: index + 1,
                items: chapterItems,
                totalPrice: chapterItems.reduce((acc: number, i: any) => acc + (i.totalPrice || 0), 0)
            };
        });

        try {
            const result = await updateBudgetAction(budget.id, {
                chapters: domainChapters, // Save hierarchical structure
                costBreakdown: state.costBreakdown,
                totalEstimated: state.costBreakdown.total
            } as any);

            if (result.success) {
                saveSuccess();
                toast({
                    title: "Presupuesto guardado",
                    description: "Los cambios se han guardado correctamente.",
                });
            } else {
                saveError();
                toast({
                    title: "Error al guardar",
                    description: result.error || "Ha ocurrido un error inesperado.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            saveError();
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-transparent overflow-hidden">
            <BudgetEditorToolbar
                hasUnsavedChanges={state.hasUnsavedChanges}
                isSaving={state.isSaving}
                canUndo={canUndo}
                canRedo={canRedo}
                onSave={handleSave}
                onUndo={undo}
                onRedo={redo}
                lastSavedAt={state.lastSavedAt}
                clientName={budget.clientSnapshot?.name || 'Cliente'}
                items={state.items}
                costBreakdown={state.costBreakdown}
                budgetNumber={budget.id.substring(0, 8)}
                showGhostMode={isGhostMode}
                onToggleGhostMode={() => setIsGhostMode(!isGhostMode)}
                onAddItem={addItem}
            />

            <main className="flex-1 w-full p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">

                <div className="max-w-[1600px] mx-auto w-full">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 pb-2">
                        {/* ... existing header code ... */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 ${sourceInfo.color} font-medium tracking-wide`}>
                                    <SourceIcon className="w-3.5 h-3.5" />
                                    {sourceInfo.label}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">#{budget.id.substring(0, 8).toUpperCase()}</span>
                            </div>

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-headline text-foreground">
                                {budget.clientSnapshot?.name || 'Cliente Desconocido'}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted-foreground pt-1">
                                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/50">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    <span className="font-medium text-foreground">
                                        {budget.specs?.interventionType === 'total' ? 'Reforma Integral' : 'Reforma Parcial'}
                                    </span>
                                </div>

                                <span className="hidden md:inline text-muted-foreground/30">•</span>

                                <span className="capitalize flex items-center gap-1.5">
                                    <Home className="w-4 h-4 text-muted-foreground" />
                                    {budget.specs?.propertyType === 'house' ? 'Vivienda' : 'Local / Oficina'}
                                </span>

                                {budget.pricingMetadata?.uploadedFileName && (
                                    <>
                                        <span className="hidden md:inline text-muted-foreground/30">•</span>
                                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <FileText className="w-4 h-4" />
                                            <span className="underline decoration-blue-300 dark:decoration-blue-700 underline-offset-4 truncate max-w-[150px]">
                                                {budget.pricingMetadata.uploadedFileName}
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mobile Only: Menu Trigger for Summary/Library Sheet */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Menu className="w-4 h-4" />
                                        Resumen y Biblioteca
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                                    <SheetTitle className="sr-only">Menú de Biblioteca y Resumen</SheetTitle>
                                    <Tabs defaultValue="summary" className="w-full mt-6">
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="summary">Resumen</TabsTrigger>
                                            <TabsTrigger value="library">Biblioteca</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="summary" className="mt-4">
                                            <BudgetEconomicSummary costBreakdown={state.costBreakdown} />
                                        </TabsContent>
                                        <TabsContent value="library" className="mt-4">
                                            <SemanticCatalogSidebar onAddItem={addItem} />
                                        </TabsContent>
                                    </Tabs>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                        {/* LEFT COLUMN: Main Content Area (Tabs) */}
                        <div className="min-w-0">
                            <Tabs defaultValue="editor" className="space-y-6">
                                <div className="overflow-x-auto pb-2 -mb-2 md:pb-0 md:mb-0">
                                    <TabsList className="bg-white dark:bg-white/5 border dark:border-white/10 shadow-sm w-full md:w-auto inline-flex justify-start">
                                        <TabsTrigger value="editor" className="flex-1 md:flex-none">Editor</TabsTrigger>
                                        <TabsTrigger value="details" className="flex-1 md:flex-none">Detalles</TabsTrigger>
                                        <TabsTrigger value="renovation" className="flex-1 md:flex-none text-purple-600 data-[state=active]:text-purple-800 data-[state=active]:bg-purple-50">
                                            Dream Renovator ✨
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="editor" className="space-y-8">
                                    <BudgetEditorTable
                                        items={state.items}
                                        chapters={state.chapters}
                                        onReorder={reorderItems}
                                        onUpdate={updateItem}
                                        onRemove={removeItem}
                                        onDuplicate={duplicateItem}
                                        onAddChapter={addChapter}
                                        onRemoveChapter={removeChapter}
                                        onRenameChapter={renameChapter}
                                        onReorderChapters={reorderChapters}
                                        showGhostMode={isGhostMode}
                                    />
                                </TabsContent>

                                <TabsContent value="details">
                                    <BudgetRequestDetails data={budget.clientSnapshot as any} />
                                </TabsContent>

                                <TabsContent value="renovation">
                                    <RenovationGallery budgetId={budget.id} renders={budget.renders} />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* RIGHT COLUMN: Summary - DESKTOP ONLY */}
                        <div className="hidden lg:block sticky top-6 space-y-6">
                            {/* Adjusted sticky top since we are in a scrollable container */}
                            <BudgetHealthWidget items={state.items} />
                            <div className="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                                    <h3 className="font-bold text-slate-800 dark:text-white">Resumen Económico</h3>
                                </div>
                                <div className="p-4">
                                    <BudgetEconomicSummary costBreakdown={state.costBreakdown} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export const BudgetEditorWrapper = ({ budget, isAdmin = false }: BudgetEditorWrapperProps) => {
    // Compatibility Layer: Migrate new 'chapters' structure to 'lineItems' for old UI components
    // pending full Phase 4 refactor.
    const legacyLineItems = React.useMemo(() => {
        // Compatibility mapper function
        const mapToLegacy = (item: any, chapterName?: string): any => {
            // If it's already in legacy format (old db records)
            if (item.item && !item.type) return { ...item, chapter: chapterName };

            // Map New Domain -> Legacy UI
            return {
                id: item.id,
                order: item.order,
                originalTask: item.originalTask || item.description,
                type: item.type, // Pass the type (PARTIDA/MATERIAL)
                chapter: chapterName,
                item: {
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    code: item.code || item.sku,
                },
                isEditing: false,
                isDirty: false
            };
        };

        if (budget.chapters) {
            return budget.chapters.flatMap(c => c.items.map(i => {
                const legacy = mapToLegacy(i, c.name);
                // Explicitly copy breakdown if it exists in domain item
                if (legacy.item && (i as any).breakdown) {
                    legacy.item.breakdown = (i as any).breakdown;
                }
                return legacy;
            }));
        }

        // Fallback for old budgets without chapters
        // @ts-ignore
        if (budget.lineItems) return budget.lineItems.map(i => mapToLegacy(i, 'General'));

        return [];
    }, [budget]);

    // Inject the mapped items back into a compatible object
    // We cast to 'any' here temporarily because we are augmenting the Budget type with a property it no longer has
    const compatibleBudget = { ...budget, lineItems: legacyLineItems } as any;

    // If it's a Quick Budget or New Build, we use the Viewer, not the full Editor
    // UPDATE: User requested full editor for all types.
    // if (compatibleBudget.type === 'quick' || compatibleBudget.type === 'new_build') {
    //    return <BudgetRequestViewer budget={compatibleBudget} isAdmin={isAdmin} />;
    // }

    return <BudgetEditorMain budget={compatibleBudget} isAdmin={isAdmin} />;
};
