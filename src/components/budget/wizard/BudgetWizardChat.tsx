'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, Sparkles, Loader2, Square, CheckCircle2, ExternalLink, Bot } from 'lucide-react';
import { useBudgetWizard, Message } from './useBudgetWizard';
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

import { Trash2 } from 'lucide-react';
import { BudgetStreamListener } from './BudgetStreamListener';
import { Toaster as SileoToaster } from 'sileo';
import 'sileo/styles.css';

// Update to accept 'state' to override score if AI thinks it's done
function calculateProgress(req: Partial<BudgetRequirement>, state?: string) {
    if (state === 'review') return 100;

    let score = 0;
    // Core Requirements (Essential): 60% total
    if (req.specs?.propertyType) score += 20;
    if (req.specs?.interventionType) score += 20;
    if (req.specs?.totalArea) score += 20;

    // Detailed Requirements:
    // If we have detected needs, great (+30)
    // If not, but we have attachments, good (+10)
    // If the user has provided premium qualities or other specs (implied by non-empty specs keys > 3), give points

    if (req.detectedNeeds?.length) {
        score += 30; // 60 + 30 = 90 (Enough to start)
    } else if (Object.keys(req.specs || {}).length > 3) {
        // Fallback: If we have extras like 'quality' or 'floors' in specs
        score += 20; // 60 + 20 = 80 (Enough to start)
    }

    if (req.attachmentUrls?.length) score += 10; // Bonus

    // Cap at 100
    return Math.min(score, 100);
}

export function BudgetWizardChat() {
    const { messages, input, setInput, sendMessage, state, requirements } = useBudgetWizard();
    const { leadId } = useWidgetContext();
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
    const [deepGeneration, setDeepGeneration] = React.useState(false); // NEW
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Create previews
        const previews = Array.from(files).map(file => URL.createObjectURL(file));

        // Show loading state
        const previousPlaceholder = input;
        setInput("Analizando documentos... esto puede tardar unos segundos 🧠");

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const { processAttachmentsAction } = await import('@/actions/attachments/process-attachments.action');
            const result = await processAttachmentsAction(formData);

            if (result.success && result.analysis) {
                const hiddenContext = `[Sistema: El usuario ha subido archivos. Análisis de visión por computadora: ${result.analysis}]`;
                const userDisplayMessage = "He subido estos archivos. ¿Qué opinas?";

                // Restore input and send
                setInput("");
                await sendMessage(userDisplayMessage, previews, hiddenContext);
            } else {
                console.error(result.error);
                setInput(previousPlaceholder);
                // Trigger an error toast or message here if possible
            }
        } catch (error) {
            console.error("Upload failed", error);
            setInput(previousPlaceholder);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
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

    if (budgetResult) {
        return (
            <div className="w-full max-w-lg mx-auto p-8 animate-in fade-in duration-500">
                <div className="text-center space-y-6">
                    <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">¡Presupuesto Generado!</h2>
                        <p className="text-muted-foreground mt-2">
                            {budgetResult.itemCount} partidas • Total: €{budgetResult.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-4">
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
        );
    }

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            // Check for Admin Commands
            if (input.startsWith('/admin-claim')) {
                const parts = input.split(' ');
                const email = parts[1];
                const secret = parts[2];

                if (!email || !secret) {
                    alert("Usage: /admin-claim <email> <secret>");
                    return;
                }

                setInput("Setting admin claim...");
                try {
                    const { setAdminClaim } = await import('@/actions/debug/fix-account.action');
                    const result = await setAdminClaim(email, secret);
                    if (result.success) {
                        alert(result.message);
                        setInput("");
                    } else {
                        alert("Error: " + result.error);
                        setInput("/admin-claim " + email + " " + secret);
                    }
                } catch (err) {
                    console.error(err);
                    alert("Failed to execute command");
                }
                return;
            }

            sendMessage(input);
        }
    };

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

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Borrar conversación y empezar de nuevo"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
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

                        {state === 'processing' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 ml-4"
                            >
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                                </div>
                                <span>Analizando...</span>
                            </motion.div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </div>

                {/* Floating Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none flex justify-center z-20">
                    <div className="pointer-events-auto w-full max-w-4xl relative">
                        <div className="relative flex items-end gap-2 rounded-[2rem] border border-input bg-background/80 md:bg-white/80 md:dark:bg-zinc-900/80 p-1.5 md:p-2 shadow-2xl shadow-black/5 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-300">
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

                            {input.trim() ? (
                                <Button
                                    onClick={() => sendMessage(input)}
                                    size="icon"
                                    className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                                >
                                    <Send className="h-4 w-4 md:h-5 md:w-5" />
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
                        </div>
                        <p className="mt-3 text-center text-xs font-medium text-gray-400 dark:text-gray-600">
                            {isRecording ? `Grabando... ${formatTime(recordingTime)}` : "Presiona Enter para enviar. Shift + Enter para línea nueva."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel: Context & Requirements (Visible on Desktop) */}
            <div className="hidden border-l border-gray-100 dark:border-white/5 md:flex md:w-1/3 flex-col bg-gray-50/50 dark:bg-zinc-900/50 backdrop-blur-sm h-full min-h-0">
                <div className="h-20 border-b border-gray-100 dark:border-white/5 px-6 flex items-center justify-between shrink-0">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Datos del Proyecto</h4>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 text-[10px] font-bold rounded-md uppercase">
                        En curso
                    </span>
                </div>

                {/* Requirements Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                    {/* Slightly adjust padding to make it less squeezed if needed, but the width 1/4 is standard */}
                    <RequirementCard requirements={requirements} className="h-full border-none shadow-none bg-transparent" />
                </div>

                {/* Progress Indicator */}
                <div className="shrink-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
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

                    {/* Generation Progress Component */}
                    <AnimatePresence>
                        {generationProgress.step !== 'idle' && (
                            <BudgetGenerationProgress
                                progress={generationProgress}
                                className="mb-4"
                            />
                        )}
                    </AnimatePresence>

                    {/* Deep Generation Toggle - Always visible for beta testing */}
                    {generationProgress.step === 'idle' && (
                        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Generación Profunda
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-white ml-2 text-amber-600 border-amber-200">Beta</Badge>
                                </span>
                                <span className="text-[10px] text-amber-700/70 dark:text-amber-500/70 leading-tight">
                                    Desglosan por capítulos y partidas (más lento).
                                </span>
                            </div>
                            <div
                                className={cn(
                                    "w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out",
                                    deepGeneration ? "bg-amber-500" : "bg-gray-200 dark:bg-white/10"
                                )}
                                onClick={() => setDeepGeneration(!deepGeneration)}
                            >
                                <div
                                    className={cn(
                                        "w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out",
                                        deepGeneration ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <AnimatePresence>
                        {(calculateProgress(requirements, state) >= 80 || state === 'review') && generationProgress.step === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Button
                                    onClick={async () => {
                                        /* ... (keep existing logic) ... */
                                        if (!requirements || !requirements.specs) return;

                                        // Retrieve leadId from context or storage (if context is lost on refresh, we might need a backup plan)
                                        // For now, assuming context is valid from the trigger flow.
                                        if (!leadId) {
                                            console.error("Lead ID missing");
                                            // Ideally show a toast or prompt to re-verify
                                            return;
                                        }

                                        setGenerationProgress({ step: 'extracting' });
                                        sendMessage("(Generando presupuesto detallado...)");

                                        try {
                                            await new Promise(r => setTimeout(r, 1500));
                                            const detectedCount = requirements.detectedNeeds?.length || 15;
                                            setGenerationProgress({
                                                step: 'extracting',
                                                extractedItems: detectedCount
                                            });

                                            await new Promise(r => setTimeout(r, 1000));
                                            setGenerationProgress({
                                                step: 'searching',
                                                extractedItems: detectedCount,
                                                currentItem: 'Buscando coincidencias...'
                                            });

                                            const { generateBudgetFromSpecsAction } = await import('@/actions/budget/generate-budget-from-specs.action');

                                            setTimeout(() => {
                                                setGenerationProgress(prev => ({
                                                    ...prev,
                                                    step: 'calculating',
                                                    currentItem: 'Calculando totales...'
                                                }));
                                            }, 3000);

                                            // Cast specs to ProjectSpecs - in a real app we would validate with Zod here
                                            // Trigger Deep Generation if enabled
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
                                                setGenerationProgress({
                                                    step: 'error',
                                                    error: 'No se pudo generar el presupuesto'
                                                });
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            setGenerationProgress({
                                                step: 'error',
                                                error: 'Error al procesar el presupuesto'
                                            });
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
                </div>
            </div>
            <SileoToaster position="bottom-right" />
        </div>
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
