
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, Search, Calculator, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThinkingStep = {
    id: string;
    message: string;
    icon?: 'brain' | 'search' | 'calc' | 'check';
    status: 'pending' | 'active' | 'completed';
};

interface AIThinkingTraceProps {
    isVisible: boolean;
    currentStep?: string; // Message to highlight
    onComplete?: () => void;
}

export const AIThinkingTrace = ({ isVisible, currentStep, onComplete }: AIThinkingTraceProps) => {
    const [steps, setSteps] = useState<ThinkingStep[]>([
        { id: '1', message: 'Analyzing Project Narrative...', icon: 'brain', status: 'pending' },
        { id: '2', message: 'Extracting Construction Tasks...', icon: 'search', status: 'pending' },
        { id: '3', message: 'Searching Price Book & Catalogs...', icon: 'search', status: 'pending' },
        { id: '4', message: 'Calculating Yields & Margins...', icon: 'calc', status: 'pending' },
        { id: '5', message: 'Validating Technical Coherence...', icon: 'check', status: 'pending' },
    ]);

    // Simulation Effect (In real app, this would be driven by server events)
    useEffect(() => {
        if (!isVisible) return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            setSteps(prev => prev.map((s, i) => {
                if (i < currentIndex) return { ...s, status: 'completed' };
                if (i === currentIndex) return { ...s, status: 'active' };
                return { ...s, status: 'pending' };
            }));

            currentIndex++;
            if (currentIndex > steps.length) {
                clearInterval(interval);
                if (onComplete) setTimeout(onComplete, 500);
            }
        }, 1500); // 1.5s per step simulation

        return () => clearInterval(interval);
    }, [isVisible, onComplete, steps.length]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse" />
                            <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400 relative z-10" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Architect</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Generando presupuesto inteligente...</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {steps.map((step) => (
                                <ThinkingStepRow key={step.id} step={step} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                        <Sparkles className="w-3 h-3" /> Powered by Genkit 2.0
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

const ThinkingStepRow = ({ step }: { step: ThinkingStep }) => {
    const isActive = step.status === 'active';
    const isCompleted = step.status === 'completed';

    const Icon = step.icon === 'search' ? Search :
        step.icon === 'calc' ? Calculator :
            step.icon === 'check' ? CheckCircle2 : BrainCircuit;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isActive ? "bg-indigo-50 dark:bg-indigo-900/10" : "transparent"
            )}
        >
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                isActive ? "border-indigo-500 text-indigo-600 animate-spin-slow" :
                    isCompleted ? "bg-green-500 border-green-500 text-white" : "border-slate-200 text-slate-300"
            )}>
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>

            <span className={cn(
                "text-sm font-medium transition-colors",
                isActive ? "text-indigo-700 dark:text-indigo-300" :
                    isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
            )}>
                {step.message}
            </span>

            {isActive && (
                <motion.div
                    layoutId="active-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                />
            )}
        </motion.div>
    );
};
