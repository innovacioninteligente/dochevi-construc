
'use client';

import { useState } from 'react';
import { EditableBudgetLineItem } from '@/types/budget-editor';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SmartInterruptCardProps {
    item: EditableBudgetLineItem;
    onResolve: (id: string, resolution: string) => void;
    onDismiss: (id: string) => void;
}

export const SmartInterruptCard = ({ item, onResolve, onDismiss }: SmartInterruptCardProps) => {
    const [response, setResponse] = useState('');

    // Parse the clarification question from the item description or note
    // Assuming the item description contains "CLARIFICATION REQUIRED: <Question>"
    const question = item.originalTask?.replace('NEEDS-INPUT:', '') || "La IA necesita más detalles para esta partida.";

    return (
        <div className="mb-4 rounded-xl border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10 border border-t-slate-200 border-r-slate-200 border-b-slate-200 dark:border-white/10 p-4 shadow-sm animate-in fade-in slide-in-from-left-2">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-400">
                    <MessageSquare className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide mb-1">
                            Aclaración Requerida
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                            {question}
                        </p>
                    </div>

                    <div className="flex gap-2 w-full max-w-lg">
                        <Input
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Ej: Cerámica blanca mate 30x60..."
                            className="bg-white dark:bg-black/20"
                            onKeyDown={(e) => e.key === 'Enter' && response && onResolve(item.id, response)}
                        />
                        <Button
                            onClick={() => onResolve(item.id, response)}
                            disabled={!response.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Responder
                        </Button>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => onDismiss(item.id)}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
