import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Hammer, Ruler, Home, Layers, Clock, Wallet, DatabaseZap, SearchCode, FileDigit, Loader2, Sparkles } from 'lucide-react';
import { BudgetRequirement } from '@/backend/budget/domain/budget-requirements';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { GenerationEvent } from './useBudgetStream';

interface RequirementCardProps {
    requirements: Partial<BudgetRequirement>;
    isProcessing?: boolean;
    isPdfProcessing?: boolean;
    events?: GenerationEvent[];
    className?: string;
}

export function RequirementCard({ requirements, isProcessing, isPdfProcessing, events = [], className }: RequirementCardProps) {
    const hasNlpData = !!requirements.projectScale || (requirements.phaseChecklist && Object.keys(requirements.phaseChecklist).length > 0);
    const hasPublicData = !!requirements.specs?.propertyType || !!requirements.targetBudget || !!requirements.urgency;
    const hasData = hasNlpData || hasPublicData || (requirements.detectedNeeds && requirements.detectedNeeds.length > 0);

    const determineProgress = (events: GenerationEvent[]) => {
        let current = 0;
        let total = 0;
        let statusText = "Inicializando...";
        let itemsCount = 0;
        let pricesMatched = 0;
        let isPricingPhase = false;

        for (const ev of events) {
            if (ev.type === 'batch_progress' && ev.data.message) {
                statusText = ev.data.message;

                if (
                    ev.data.message.match(/Lote \d+ de \d+/i) ||
                    ev.data.message.match(/batch \d+ of \d+/i) ||
                    ev.data.message.toLowerCase().includes('equivalencias') ||
                    ev.data.message.toLowerCase().includes('asignando precios')
                ) {
                    isPricingPhase = true;
                }

                const match = ev.data.message.match(/Lote (\d+) de (\d+)/i) ||
                    ev.data.message.match(/batch (\d+) of (\d+)/i) ||
                    ev.data.message.match(/bloque de texto (\d+) de (\d+)/i) ||
                    ev.data.message.match(/página (\d+) de (\d+)/i);

                if (match) {
                    current = parseInt(match[1], 10);
                    total = parseInt(match[2], 10);
                }
            } else if (ev.type === 'subtasks_extracted') {
                itemsCount = ev.data.count;
                statusText = `Identificadas ${itemsCount} partidas`;
                isPricingPhase = true;
            } else if (ev.type === 'item_resolved') {
                pricesMatched++;
            }
        }

        const phasePercentage = total > 0 ? (current / total) * 100 : 0;
        let globalPercentage = 0;
        if (isPricingPhase) {
            globalPercentage = total > 0 ? 50 + (phasePercentage / 2) : 50;
        } else {
            globalPercentage = total > 0 ? (phasePercentage / 2) : 0;
        }

        return {
            percentage: Math.min(Math.round(globalPercentage), 100),
            statusText,
            current,
            total,
            itemsCount,
            pricesMatched
        };
    };

    // If there is strictly NO data yet
    if (!hasData) {
        // ...but we are processing a PDF (we have events)
        if (isProcessing && (isPdfProcessing || events.length > 0)) {
            const { percentage, statusText, current, total, itemsCount, pricesMatched } = determineProgress(events);
            const displayEvents = [...events].reverse().slice(0, 4);

            return (
                <div className={cn("rounded-xl border border-border/40 dark:border-white/10 bg-gradient-to-b from-background/40 to-muted/20 dark:from-white/5 dark:to-transparent p-6 flex flex-col items-start justify-start space-y-6 h-full", className)}>

                    {/* Header and Progress */}
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="relative flex h-3 w-3">
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400")}></span>
                                    <span className={cn("relative inline-flex rounded-full h-3 w-3 bg-amber-500")}></span>
                                </div>
                                <h3 className="font-semibold text-sm text-foreground">
                                    {isPdfProcessing ? "Procesando Documento" : "Analizando Petición"}
                                </h3>
                            </div>
                            <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                                {percentage}%
                            </span>
                        </div>

                        {/* We use inline styles for the indicator color if Progress component doesn't support indicatorClassName */}
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-500 ease-out bg-amber-500")}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                            <span className="line-clamp-1 flex-1 mr-2">{statusText}</span>
                            {total > 0 && <span className="shrink-0 font-medium">Paso {current}/{total}</span>}
                        </div>
                    </div>

                    {/* Stats Row */}
                    {(itemsCount > 0 || pricesMatched > 0) ? (
                        <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    <FileDigit className="w-3.5 h-3.5" /> Partidas
                                </div>
                                <span className="text-xl font-bold text-foreground">{itemsCount}</span>
                            </div>
                            <div className="flex flex-col p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                                    <DatabaseZap className="w-3.5 h-3.5" /> Precios BBDD
                                </div>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{pricesMatched}</span>
                            </div>
                        </div>
                    ) : null}

                    {/* Animated Event Cards */}
                    <div className="w-full flex-1 flex flex-col justify-end relative overflow-hidden pt-4">
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/80 to-transparent dark:from-background/80 z-10 pointer-events-none" />
                        <div className="flex flex-col-reverse gap-2.5 w-full pb-2">
                            <AnimatePresence initial={false}>
                                {displayEvents.map((ev, i) => (
                                    <motion.div
                                        key={`${ev.timestamp}-${i}-${ev.type}`}
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1 - (i * 0.25), y: 0, scale: 1 - (i * 0.02) }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className={cn(
                                            "rounded-lg p-3 text-sm flex items-start gap-3 border shadow-sm transition-all",
                                            i === 0
                                                ? "bg-white dark:bg-black/40 border-amber-200/50 dark:border-amber-500/30 ring-1 ring-amber-500/10"
                                                : "bg-slate-50/60 dark:bg-black/20 border-slate-200/50 dark:border-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-0.5 p-1 rounded-md",
                                            i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"
                                        )}>
                                            {getEventIcon(ev.type)}
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                                    {ev.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/50 font-mono">
                                                    {new Date(ev.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                                {formatEventMessage(ev)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            );
        }

        // Idle state, waiting for the user to chat and produce the first piece of data
        return (
            <div className={cn("rounded-xl border border-dashed border-border/40 dark:border-white/10 bg-background/40 dark:bg-white/5 p-8 text-center flex items-center justify-center", className)}>
                <p className="text-sm text-muted-foreground dark:text-white/40">
                    Aquí verás cómo la IA estructura tu solicitud en tiempo real.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className={cn("h-full pr-4", className)}>
            <div className="space-y-6">
                {/* Key Metrics Grid */}
                <MetricItem
                    icon={Home}
                    label="Tipo"
                    value={requirements.specs?.propertyType ? translateType(requirements.specs.propertyType) : '-'}
                    filled={!!requirements.specs?.propertyType}
                />
                <MetricItem
                    icon={Layers}
                    label="Alcance"
                    value={requirements.specs?.interventionType ? translateScope(requirements.specs.interventionType) : '-'}
                    filled={!!requirements.specs?.interventionType}
                />
                <MetricItem
                    icon={Ruler}
                    label="Superficie"
                    value={requirements.specs?.totalArea ? `${requirements.specs.totalArea} m²` : '-'}
                    filled={!!requirements.specs?.totalArea}
                />
                <MetricItem
                    icon={Wallet}
                    label="Presupuesto"
                    value={requirements.targetBudget || '-'}
                    filled={!!requirements.targetBudget}
                />
                <MetricItem
                    icon={Clock}
                    label="Urgencia"
                    value={requirements.urgency || '-'}
                    filled={!!requirements.urgency}
                />
            </div>

            {/* Scale Classification (Aparejador Triage) */}
            {requirements.projectScale && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-center mb-4">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                        Clasificación: {translateScale(requirements.projectScale)}
                    </span>
                </div>
            )}

            {/* Phase Checklist (Aparejador Logic) */}
            {requirements.phaseChecklist && Object.keys(requirements.phaseChecklist).length > 0 && (
                <div className="space-y-3 mb-6">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-white/50">Auditoría de Fases</h5>
                    <div className="flex flex-col gap-2">
                        {Object.entries(requirements.phaseChecklist).map(([phase, state], idx) => {
                            const isPending = state === 'pending';
                            const isAddressed = state === 'addressed';
                            const isNotApp = state === 'not_applicable';
                            return (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className={cn(
                                        "truncate flex-1 max-w-[180px]",
                                        isPending ? "text-muted-foreground/60" : "text-foreground dark:text-white/90"
                                    )}>{phase}</span>

                                    {isPending && <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 whitespace-nowrap">Pendiente</span>}
                                    {isAddressed && <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 whitespace-nowrap">Cubierto</span>}
                                    {isNotApp && <span className="rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 whitespace-nowrap">N/A</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detected Needs List */}
            {requirements.detectedNeeds && requirements.detectedNeeds.length > 0 && (
                <div className="space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-white/50">Partidas Identificadas</h5>
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {requirements.detectedNeeds.map((need, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/50 dark:border-white/10 bg-background/50 dark:bg-white/5 px-3 py-1 text-xs text-foreground dark:text-white/80"
                                >
                                    <Check className="h-3 w-3 text-amber-500" />
                                    {need.category}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Quality Badge (Optional) */}
            {requirements.specs?.qualityLevel && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                        Calidad: {translateQuality(requirements.specs.qualityLevel)}
                    </span>
                </div>
            )}
        </ScrollArea >
    );
}

function MetricItem({ icon: Icon, label, value, filled }: any) {
    return (
        <div className={cn(
            "flex flex-col gap-1 rounded-lg border p-3 transition-colors",
            filled
                ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                : "border-border/30 dark:border-white/5 bg-background/30 dark:bg-white/5"
        )}>
            <div className="flex items-center gap-2 text-muted-foreground dark:text-white/40">
                <Icon className={cn("h-3.5 w-3.5", filled && "text-amber-500")} />
                <span className="text-[10px] uppercase tracking-wide">{label}</span>
            </div>
            <span className={cn(
                "font-medium text-sm truncate",
                filled ? "text-foreground dark:text-white" : "text-muted-foreground/50 dark:text-white/20"
            )}>
                {value}
            </span>
        </div>
    );
}

// Helpers
function translateType(type: string) {
    const map: any = { residential: 'Vivienda', commercial: 'Local', office: 'Oficina' };
    return map[type] || type;
}
function translateScope(scope: string) {
    const map: any = { integral: 'Integral', partial: 'Parcial', kitchen: 'Cocina', bathroom: 'Baño' };
    return map[scope] || scope;
}
function translateQuality(quality: string) {
    const map: any = { basic: 'Básica', medium: 'Media', premium: 'Premium', luxury: 'Lujo' };
    return map[quality] || quality;
}
function translateScale(scale: string) {
    if (scale === 'minor') return 'Obra Menor';
    if (scale === 'major') return 'Obra Mayor';
    return 'Por Definir';
}

function formatEventMessage(ev: GenerationEvent) {
    switch (ev.type) {
        case 'batch_progress': return <span className="font-medium">{ev.data.message || 'Procesando lote...'}</span>;
        case 'subtasks_extracted': return `El analizador ha clasificado el documento en ${ev.data.count} tareas organizadas.`;
        case 'chapter_start': return <span className="font-semibold">{ev.data.name}</span>;
        case 'decomposition_start': return <span className="italic">{ev.data.description}</span>;
        case 'vector_search': return `Haciendo match espacial para: ${ev.data.query}`;
        case 'item_resolved': return <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ {ev.data.item.description || ev.data.item.name} a {ev.data.item.unitPrice}€</span>;
        case 'complete': return <span className="text-emerald-600 dark:text-emerald-400 font-bold">Proceso completado exitosamente. Generando vista.</span>;
        default: return `Leyendo flujos del agente...`;
    }
}

function getEventIcon(type: string) {
    switch (type) {
        case 'batch_progress': return <Loader2 className="w-4 h-4 animate-spin text-amber-500" />;
        case 'subtasks_extracted': return <Layers className="w-4 h-4 text-blue-500" />;
        case 'chapter_start': return <Home className="w-4 h-4 text-purple-500" />;
        case 'decomposition_start': return <SearchCode className="w-4 h-4 text-indigo-500" />;
        case 'vector_search': return <DatabaseZap className="w-4 h-4 text-amber-500" />;
        case 'item_resolved': return <Check className="w-4 h-4 text-emerald-500" />;
        case 'complete': return <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />;
        default: return <Hammer className="w-4 h-4" />;
    }
}
