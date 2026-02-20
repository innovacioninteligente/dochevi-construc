
'use client';

import { EditableBudgetLineItem } from '@/types/budget-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface BudgetHealthWidgetProps {
    items: EditableBudgetLineItem[];
}

export const BudgetHealthWidget = ({ items }: BudgetHealthWidgetProps) => {
    // Analysis
    const totalItems = items.length;
    if (totalItems === 0) return null;

    const zeroPriceItems = items.filter(i => (i.item?.totalPrice || 0) <= 0);
    const lowConfidenceItems = items.filter(i => (i.item?.matchConfidence || 100) < 50);
    const resolvedInterrupts = items.filter(i => i.id.startsWith('RESOLVED-'));

    // Health Score Calculation (Mock Logic)
    let score = 100;
    score -= (zeroPriceItems.length * 10);
    score -= (lowConfidenceItems.length * 5);
    score = Math.max(0, score);

    const healthColor = score > 80 ? 'text-emerald-600' : score > 50 ? 'text-amber-600' : 'text-red-600';
    const healthBg = score > 80 ? 'bg-emerald-50 dark:bg-emerald-500/10' : score > 50 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10';

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider flex items-center justify-between">
                    <span>Salud del Presupuesto</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", healthBg, healthColor)}>
                        {score}/100
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">

                {/* Score Bar */}
                <Progress
                    value={score}
                    className="h-2"
                    indicatorClassName={score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}
                />

                {/* Issues List */}
                <div className="space-y-2">
                    {zeroPriceItems.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                <b>{zeroPriceItems.length} partidas</b> sin precio definido.
                            </span>
                        </div>
                    )}

                    {lowConfidenceItems.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                <b>{lowConfidenceItems.length} partidas</b> con baja confianza de IA. Revisar descripción y precios.
                            </span>
                        </div>
                    )}

                    {resolvedInterrupts.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                <b>{resolvedInterrupts.length} aclaraciones</b> resueltas manualmente.
                            </span>
                        </div>
                    )}

                    {score === 100 && (
                        <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                El presupuesto parece técnicamente coherente y completo.
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
