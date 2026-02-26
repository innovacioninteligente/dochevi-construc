'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, Sparkles, Loader2, Square, CheckCircle2, ExternalLink, Bot, X, FileText, FileImage, Trash2, Check, Activity } from 'lucide-react';
import { useBudgetWizard, Message, WizardState } from './useBudgetWizard';
import { useWidgetContext } from '@/context/budget-widget-context';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RequirementCard } from './RequirementCard';
import { BudgetRequirement } from '@/backend/budget/domain/budget-requirements';
import { BudgetGenerationProgress, GenerationStep } from '@/components/budget/BudgetGenerationProgress';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BudgetStreamListener } from './BudgetStreamListener';
import { Toaster as SileoToaster } from 'sileo';
import 'sileo/styles.css';
import { useBudgetStream } from './useBudgetStream'; // NEW: Import useBudgetStream
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';

// Update to accept 'state' to override score if AI thinks it's done
function calculateProgress(reqs: Partial<BudgetRequirement>, state: WizardState) {
    if (state === 'review') return 100;

    let score = 0;
    let maxScore = 0;

    // 1. NLP / Aparejador Logic
    const hasNlpContext = !!reqs.projectScale || (reqs.phaseChecklist && Object.keys(reqs.phaseChecklist).length > 0);
    if (hasNlpContext) {
        maxScore += 2; // scale + at least one chapter
        if (reqs.projectScale) score += 1;
        if (reqs.phaseChecklist) {
            const chapters = Object.values(reqs.phaseChecklist);
            if (chapters.length > 0) {
                const totalChapters = chapters.length;
                const addressedChapters = chapters.filter(s => s === 'addressed' || s === 'not_applicable').length;
                score += (addressedChapters / totalChapters);
            }
        }
    }

    // 2. Public / Specs Logic
    const hasSpecsContext = !!reqs.specs || !!reqs.targetBudget || !!reqs.urgency;
    if (hasSpecsContext) {
        maxScore += 3;
        if (reqs.specs?.propertyType) score += 1;
        if (reqs.specs?.interventionType) score += 1;
        if (reqs.specs?.totalArea) score += 1;
    }

    // 3. Fallback generic base
    if (!hasNlpContext && !hasSpecsContext) {
        if (Object.keys(reqs).length > 0) return 15;
        return 0;
    }

    if (maxScore === 0) return 0;

    // Add a bump if the agent explicitly signals it's ready
    if (reqs.isReadyForGeneration) return 100;

    const basePercentage = Math.round((score / maxScore) * 100);
    return Math.min(basePercentage, 95); // cap at 95 until ready
}

export function BudgetWizardChat({ mode = 'public' }: { mode?: 'public' | 'private' }) {
    const { messages, input, setInput, sendMessage, state, requirements } = useBudgetWizard(mode);
    const { leadId } = useWidgetContext();
    const { events: streamEvents, clearEvents } = useBudgetStream(); // NEW: Connecting SSE logs
    const { isRecording, startRecording, stopRecording, recordingTime } = useAudioRecorder();
    const [budgetResult, setBudgetResult] = React.useState<{ id: string; total: number; itemCount: number } | null>(null);
    const router = useRouter();
    const [generationProgress, setGenerationProgress] = React.useState<{
        step: GenerationStep;
        extractedItems?: number;
        matchedItems?: number;
        currentItem?: string;
        error?: string;
    }>({ step: 'idle' });
    const [deepGeneration, setDeepGeneration] = React.useState(true); // Default to Deep Generation

    // NEW: Staged Files State
    const [stagedFiles, setStagedFiles] = React.useState<{ file: File; base64: string; preview: string; isPdf: boolean }[]>([]);

    // Computed based on backend state rather than front-end local state to avoid getting stuck during NLP flows
    const isPdfProcessing = !!(requirements as any)?.activeBatchJobId && !budgetResult;


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Collect new staged files
        const newStagedFiles = await Promise.all(Array.from(files).map(async (file) => {
            const isPdf = file.type === 'application/pdf';
            let preview = '';

            if (!isPdf) {
                preview = URL.createObjectURL(file);
            }

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
                reader.onerror = error => reject(error);
            });

            return { file, base64, preview, isPdf };
        }));

        setStagedFiles(prev => [...prev, ...newStagedFiles]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMicClick = async () => {
        if (isRecording) {
            const blob = await stopRecording();
            if (blob) {
                // Create FormData
                const formData = new FormData();
                formData.append('audio', blob, 'recording.webm');

                // Optimistic UI update or loading state could go here
                setInput("Transcribiendo audio...");

                try {
                    const { processAudioAction } = await import('@/actions/audio/process-audio.action');
                    const result = await processAudioAction(formData);

                    if (result.success && result.transcription) {
                        // Append transcription to current input or replace it? 
                        // Let's replace for now, or append if input existed.
                        setInput(prev => prev === "Transcribiendo audio..." ? result.transcription : `${prev} ${result.transcription}`);
                    } else {
                        console.error(result.error);
                        setInput(""); // Clear loading text on error
                        // toast error
                    }
                } catch (error) {
                    console.error("Audio upload failed", error);
                    setInput("");
                }
            }
        } else {
            await startRecording();
        }
    };
    const handleReset = async () => {
        if (!leadId) return;
        if (!confirm("¿Estás seguro de que quieres borrar la conversación? Esto no se puede deshacer.")) return;

        setInput("Reseteando conversación...");
        try {
            const { resetConversationAction } = await import('@/actions/chat/reset-conversation.action');
            await resetConversationAction(leadId);
            window.location.reload();
        } catch (error) {
            console.error("Failed to reset:", error);
            setInput("");
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom - MUST be before any conditional returns!
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Batch Job Polling
    useEffect(() => {
        const jobId = (requirements as any).activeBatchJobId;
        if (!jobId || budgetResult) return;

        let isPolling = true;
        let pollCount = 1;

        const pollStatus = async () => {
            if (!isPolling) return;

            try {
                const { checkBatchJobStatusAction, processBatchJobResultAction } = await import('@/actions/ai/check-batch-status.action');
                const statusResult = await checkBatchJobStatusAction(jobId);

                if (statusResult.success) {
                    const state = statusResult.state;

                    if (state === 'JOB_STATE_RUNNING' || state === 'RUNNING') {
                        setGenerationProgress({ step: 'extracting', currentItem: `[Revisión ${pollCount}] Analizando partidas de tu documento PDF...` });
                    } else if (state === 'JOB_STATE_PENDING' || state === 'PENDING') {
                        setGenerationProgress({ step: 'extracting', currentItem: `[Revisión ${pollCount}] Trabajo en cola (esperando servidor)...` });
                    } else if (state === 'JOB_STATE_SUCCEEDED' || state === 'SUCCEEDED') {
                        isPolling = false;
                        setGenerationProgress({ step: 'searching', currentItem: 'Buscando precios en catálogo (Vector Search)...' });

                        // Process the result immediately
                        const processResult = await processBatchJobResultAction(jobId);
                        if (processResult.success && processResult.data) {
                            const newBudgetId = "batch-" + Date.now();
                            const itemCount = processResult.data.summary.totalItems;
                            const total = processResult.data.summary.total;
                            const matchedItems = processResult.data.summary.matchedItems;

                            setGenerationProgress({
                                step: 'complete',
                                extractedItems: itemCount,
                                matchedItems: matchedItems
                            });

                            await new Promise(r => setTimeout(r, 1500));
                            setBudgetResult({ id: newBudgetId, total, itemCount });
                        } else {
                            setGenerationProgress({ step: 'error', error: processResult.error || 'Error al procesar el resultado del batch.' });
                        }
                    } else if (state === 'JOB_STATE_FAILED' || state === 'FAILED' || state === 'JOB_STATE_CANCELLED') {
                        isPolling = false;
                        setGenerationProgress({ step: 'error', error: 'El procesamiento en la nube ha fallado.' });
                    }
                } else {
                    // Gracefully continue polling if API unavailable (e.g. 503)
                    setGenerationProgress({ step: 'extracting', currentItem: `[Revisión ${pollCount}] La API está temporalmente saturada, reintentando...` });
                }
            } catch (error) {
                console.error("Polling error", error);
                setGenerationProgress({ step: 'extracting', currentItem: `[Revisión ${pollCount}] Error temporal de conexión. Reintentando...` });
            }

            if (isPolling) {
                pollCount++;
                setTimeout(pollStatus, 30000); // Poll every 30 seconds
            }
        };

        // Start polling
        setGenerationProgress({ step: 'extracting', currentItem: 'Iniciando procesamiento profundo (esto puede tardar unos minutos)...' });
        // Set an initial delay of 15 seconds to let the job queue
        const initialTimer = setTimeout(pollStatus, 15000);

        return () => {
            isPolling = false;
            clearTimeout(initialTimer);
        };
    }, [(requirements as any).activeBatchJobId, budgetResult]);

    // NEW: Synchronous Job Completion Listener
    useEffect(() => {
        const completedId = (requirements as any).completedBudgetId;
        const total = (requirements as any).completedBudgetTotal || 0;
        const itemCount = (requirements as any).completedBudgetItems || 0;

        if (completedId && !budgetResult) {
            setGenerationProgress({
                step: 'complete',
            });
            // Give a small delay for UI smoothness
            const timer = setTimeout(() => {
                setBudgetResult({
                    id: completedId,
                    total: total,
                    itemCount: itemCount
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [(requirements as any).completedBudgetId, budgetResult]);

    if (budgetResult) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-lg mx-auto bg-white dark:bg-zinc-900/50 p-8 rounded-3xl md:border md:border-black/5 dark:border-white/5 md:shadow-xl md:-mt-10 animate-in fade-in zoom-in-95 duration-500 relative z-20">
                    <div className="text-center space-y-6">
                        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">¡Presupuesto Generado!</h2>
                            <p className="text-muted-foreground mt-2 font-medium">
                                {budgetResult.itemCount} partidas • Total: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(budgetResult.total)}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4 mb-4">
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    {requirements.specs?.propertyType ? requirements.specs.propertyType : 'Nuevo Proyecto'}
                                </Badge>
                                {requirements.specs?.totalArea && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        {requirements.specs.totalArea} m²
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                                onClick={() => router.push(`/dashboard/admin/budgets/${budgetResult.id}/edit`)}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ir al Presupuesto
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setBudgetResult(null);
                                    setGenerationProgress({ step: 'idle' });
                                    window.location.reload();
                                }}
                            >
                                Crear otro presupuesto
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        // Build arguments from state
        const textToSend = input.trim();
        const hasFiles = stagedFiles.length > 0;

        if (!textToSend && !hasFiles) return;

        // Extract array structures for the sendMessage action
        const attachments = stagedFiles.map(sf => sf.preview).filter(Boolean); // Only non-empty previews (images)
        const base64Files = stagedFiles.map(sf => sf.base64);

        const finalMessage = textToSend || (hasFiles ? "Documentos adjuntos." : "");

        sendMessage(finalMessage, attachments, base64Files);
        setStagedFiles([]); // Clear stage
    };

    const renderContextPanel = () => (
        <>
            <div className="h-20 border-b border-gray-100 dark:border-white/5 px-6 flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Datos del Proyecto</h4>
                {state === 'processing' || generationProgress.step !== 'idle' ? (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-[10px] font-bold rounded-md uppercase animate-pulse border border-amber-200 dark:border-amber-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
                        Analizando
                    </span>
                ) : Object.keys(requirements).length > 0 ? (
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-500 text-[10px] font-bold rounded-md uppercase border border-blue-100 dark:border-blue-900/50">
                        Borrador
                    </span>
                ) : (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-md uppercase">
                        Esperando
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                <RequirementCard
                    requirements={requirements}
                    isProcessing={state === 'processing'}
                    isPdfProcessing={isPdfProcessing}
                    events={streamEvents}
                    className="h-full border-none shadow-none bg-transparent"
                />
            </div>

            <div className="shrink-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
                {!isPdfProcessing && (
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span>Completado</span>
                            <span className="text-gray-900 dark:text-white">{calculateProgress(requirements, state)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${calculateProgress(requirements, state)}%` }}
                            />
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {generationProgress.step !== 'idle' && (
                        <BudgetGenerationProgress
                            progress={generationProgress}
                            className="mb-4"
                        />
                    )}
                </AnimatePresence>

                {generationProgress.step === 'idle' && (
                    <div className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-500 flex items-center gap-1">
                                Generación Profunda Activada
                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-white dark:bg-black/20 ml-1 text-amber-600 border-amber-200 dark:border-amber-800">Beta</Badge>
                            </span>
                            <span className="text-[10px] text-amber-700/70 dark:text-amber-500/70 leading-relaxed mt-0.5">
                                La IA desglosará analíticamente todas las medidas en capítulos y buscará equivalencias exactas en la Base de Datos.
                            </span>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {mode === 'private' && (requirements.isReadyForGeneration || calculateProgress(requirements, state) >= 90 || state === 'review') && generationProgress.step === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Button
                                onClick={async () => {
                                    if (!leadId) {
                                        console.error("Lead ID missing");
                                        return;
                                    }

                                    setGenerationProgress({ step: 'extracting' });
                                    sendMessage("(Generando presupuesto detallado...)");

                                    try {
                                        // Detect if this is a PDF flow or an NLP flow
                                        const isNlpFlow = !isPdfProcessing && !messages.some(m => m.attachments?.some(a => a.startsWith('JVBER')));

                                        if (isNlpFlow) {
                                            // ─── ROUTE A: NLP-TO-BUDGET (Aparejador) ───
                                            const { orchestrateNlpToBudgetAction } = await import('@/actions/budget/orchestrate-nlp-budget.action');

                                            setGenerationProgress({ step: 'extracting', currentItem: 'Estructurando capítulos...' });
                                            await new Promise(r => setTimeout(r, 1000));

                                            // The orchestrator takes the full conversation description 
                                            // (we pass the original prompt or the accumulated specs)
                                            const contextMessage = requirements.originalPrompt || messages.map(m => m.content).join('\n');

                                            setGenerationProgress(prev => ({ ...prev, step: 'searching', currentItem: 'Buscando partidas en Base de Datos...' }));

                                            const result = await orchestrateNlpToBudgetAction(leadId, contextMessage, requirements.specs as any);

                                            setGenerationProgress(prev => ({ ...prev, step: 'calculating', currentItem: 'Calculando totales...' }));
                                            await new Promise(r => setTimeout(r, 1000));

                                            if (result.success && result.data) {
                                                const totalItems = result.data.phases.reduce((sum, p) => sum + p.items.length, 0);
                                                setGenerationProgress({
                                                    step: 'complete',
                                                    extractedItems: totalItems,
                                                    matchedItems: totalItems
                                                });
                                                setBudgetResult({ id: result.data.projectId, total: result.data.totalEstimated, itemCount: totalItems });
                                            } else {
                                                setGenerationProgress({ step: 'error', error: 'No se pudo generar el presupuesto NLP' });
                                            }
                                        } else {
                                            // ─── ROUTE B: PDF-TO-BUDGET (Existing) ───
                                            if (!requirements || !requirements.specs) return;

                                            await new Promise(r => setTimeout(r, 1500));
                                            const detectedCount = requirements.detectedNeeds?.length || 15;
                                            setGenerationProgress({ step: 'extracting', extractedItems: detectedCount });

                                            await new Promise(r => setTimeout(r, 1000));
                                            setGenerationProgress({ step: 'searching', extractedItems: detectedCount, currentItem: 'Buscando coincidencias...' });

                                            const { generateBudgetFromSpecsAction } = await import('@/actions/budget/generate-budget-from-specs.action');

                                            setTimeout(() => {
                                                setGenerationProgress(prev => ({ ...prev, step: 'calculating', currentItem: 'Calculando totales...' }));
                                            }, 3000);

                                            const result = await generateBudgetFromSpecsAction(leadId, requirements.specs as any, deepGeneration);

                                            if (result.success && result.budgetResult) {
                                                const budgetId = result.budgetId || result.budgetResult.id;
                                                const itemCount = result.budgetResult.lineItems?.length || 0;
                                                const total = result.budgetResult.costBreakdown?.total || result.budgetResult.totalEstimated || 0;

                                                setGenerationProgress({
                                                    step: 'complete',
                                                    extractedItems: itemCount,
                                                    matchedItems: result.budgetResult.lineItems?.filter((i: any) => !i.isEstimate).length || 0
                                                });

                                                await new Promise(r => setTimeout(r, 1500));
                                                setBudgetResult({ id: budgetId, total, itemCount });
                                            } else {
                                                setGenerationProgress({ step: 'error', error: 'No se pudo generar el presupuesto' });
                                            }
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        setGenerationProgress({ step: 'error', error: 'Error al procesar el presupuesto' });
                                    }
                                }}
                                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold h-12 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                Generar Presupuesto
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {(budgetResult || requirements.completedBudgetId) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-4"
                        >
                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/50 flex flex-col items-center text-center space-y-3 shadow-inner">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mb-1 shadow-sm">
                                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Presupuesto Listo</h4>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-1">El documento ha sido analizado y valorado con éxito.</p>
                                </div>
                                <Button
                                    onClick={() => router.push(`/dashboard/admin/budgets/${(budgetResult as any)?.id || requirements.completedBudgetId}/edit`)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg mt-2 shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Ver Presupuesto
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );

    return (
        <div className="flex h-full w-full overflow-hidden md:rounded-3xl md:border md:border-white/20 bg-background md:bg-white/95 md:dark:bg-black/90 md:shadow-2xl md:backdrop-blur-2xl md:ring-1 md:ring-black/5 md:dark:ring-white/10 relative">
            {/* Stream Listener for Sileo Notifications */}
            <BudgetStreamListener />

            {/* Left Panel: Chat Interface */}
            <div className="flex w-full flex-col md:w-2/3 relative h-full min-h-0">
                {/* Header */}
                <header className="absolute top-0 left-0 right-0 z-10 flex h-16 md:h-20 items-center justify-between px-4 md:px-8 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-orange-600 shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-display text-base md:text-lg font-bold text-foreground tracking-tight">Arquitecto IA</h3>
                            <p className="text-[10px] md:text-xs font-medium text-muted-foreground tracking-wide uppercase">Asistente Inteligente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                        {mode === 'private' && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground relative">
                                        {(state === 'processing' || generationProgress.step !== 'idle') && (
                                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                            </span>
                                        )}
                                        <Activity className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[85vw] sm:max-w-md p-0 flex flex-col bg-gray-50/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Estado del Proyecto</SheetTitle>
                                    </SheetHeader>
                                    {renderContextPanel()}
                                </SheetContent>
                            </Sheet>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Borrar conversación y empezar de nuevo"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar relative bg-background/50">
                    <div className="max-w-4xl mx-auto pt-20 pb-40 px-4 md:px-0 space-y-6 md:space-y-8">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
                                >
                                    <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-900/10 mb-2">
                                        <Bot className="w-12 h-12 text-amber-500/50" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">¿En qué puedo ayudarte hoy?</h2>
                                    <p className="max-w-md text-gray-500 dark:text-gray-400">
                                        Puedo ayudarte a estimar costos, definir materiales o planificar tu reforma integral.
                                    </p>
                                </motion.div>
                            ) : (
                                messages.map((msg, index) => (
                                    <ChatBubble key={msg.id} message={msg} />
                                ))
                            )}
                        </AnimatePresence>

                        <div ref={scrollRef} />
                    </div>
                </div>

                {/* Floating Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none flex justify-center z-20">
                    <div className="pointer-events-auto w-full max-w-4xl relative">
                        {/* Staged Files Preview Bar */}
                        <AnimatePresence>
                            {stagedFiles.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="flex flex-wrap gap-2 mb-3 bg-white/50 dark:bg-black/50 p-2 md:p-3 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm"
                                >
                                    {stagedFiles.map((sf, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center p-1.5 px-3 shrink-0 transition-all hover:pr-8">
                                            {sf.isPdf ? (
                                                <div className="bg-red-500/10 p-1.5 rounded-lg mr-2">
                                                    <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                </div>
                                            ) : (
                                                <div className="bg-blue-500/10 p-1.5 rounded-lg mr-2">
                                                    <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{sf.file.name}</span>
                                            <button
                                                onClick={(e) => { e.preventDefault(); removeStagedFile(idx); }}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end gap-2 rounded-[2rem] border border-input bg-background/80 md:bg-white/80 md:dark:bg-zinc-900/80 p-1.5 md:p-2 shadow-2xl shadow-black/5 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-300">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleAttachmentClick}
                                className="h-10 w-10 shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>

                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe tu proyecto..."
                                className="min-h-[44px] max-h-32 w-full resize-none border-0 bg-transparent py-3 text-base placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-0 text-gray-900 dark:text-gray-100 scrollbar-hide font-medium"
                                rows={1}
                            />

                            {input.trim() || stagedFiles.length > 0 ? (
                                <Button
                                    onClick={(e) => { e.preventDefault(); handleSend(); }}
                                    size="icon"
                                    className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                                >
                                    <Send className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                                </Button>
                            ) : (
                                <Button
                                    variant={isRecording ? "destructive" : "ghost"}
                                    size="icon"
                                    onClick={handleMicClick}
                                    className={cn(
                                        "h-10 w-10 shrink-0 rounded-xl transition-all duration-200",
                                        isRecording
                                            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse ring-4 ring-red-500/20"
                                            : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
                                </Button>
                            )}
                        </form>
                        <p className="mt-3 text-center text-xs font-medium text-gray-400 dark:text-gray-600">
                            {isRecording ? `Grabando... ${formatTime(recordingTime)}` : "Presiona Enter para enviar. Shift + Enter para línea nueva."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel: Context & Requirements (Visible on Desktop) */}
            {
                mode === 'private' && (
                    <div className="hidden border-l border-gray-100 dark:border-white/5 md:flex md:w-1/3 flex-col bg-gray-50/50 dark:bg-zinc-900/50 backdrop-blur-sm h-full min-h-0">
                        {renderContextPanel()}
                    </div>
                )
            }
            <SileoToaster position="bottom-right" />
        </div >
    );
}

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                "flex w-full min-w-0",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "relative max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm overflow-hidden",
                    "break-words whitespace-pre-wrap",
                    isUser
                        ? "bg-amber-500 text-white rounded-br-none shadow-amber-500/10"
                        : "bg-white dark:bg-white/10 text-slate-800 dark:text-white/90 rounded-bl-none border border-slate-100 dark:border-white/5 shadow-sm dark:backdrop-blur-md"
                )}
            >
                <div className="break-words overflow-hidden space-y-2">
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {message.attachments.map((url, i) => (
                                <div key={i} className="relative group rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Adjunto ${i + 1}`}
                                        className="max-w-[200px] max-h-[150px] object-cover bg-gray-100 dark:bg-gray-800"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                <span className={cn(
                    "absolute -bottom-5 text-[10px] whitespace-nowrap",
                    isUser ? "right-0 text-muted-foreground/60 dark:text-white/30" : "left-0 text-muted-foreground/60 dark:text-white/30"
                )}>
                    {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
