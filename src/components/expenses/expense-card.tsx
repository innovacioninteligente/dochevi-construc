'use client';

import { Expense, ExpenseStatus } from '@/backend/expense/domain/expense';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText, CheckCircle2, XCircle, Clock, Sparkles,
    Building2, Calendar, Receipt, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { validateExpenseAction } from '@/actions/expense/validate-expense.action';
import { rejectExpenseAction } from '@/actions/expense/reject-expense.action';

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; icon: React.ElementType }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
    validada: { label: 'Validada', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
    rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};

interface ExpenseCardProps {
    expense: Expense;
    locale: string;
}

export function ExpenseCard({ expense, locale }: ExpenseCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const statusConfig = STATUS_CONFIG[expense.status];
    const StatusIcon = statusConfig.icon;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
            date instanceof Date ? date : new Date(date)
        );
    };

    const handleValidate = async () => {
        setLoading(true);
        await validateExpenseAction(expense.id);
        setLoading(false);
    };

    const handleReject = async () => {
        setLoading(true);
        await rejectExpenseAction(expense.id);
        setLoading(false);
    };

    return (
        <Card className="group border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex-shrink-0">
                            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">
                                    {expense.providerName}
                                </h3>
                                {expense.extractedByAI && (
                                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400 flex-shrink-0">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {expense.invoiceNumber && (
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {expense.invoiceNumber}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(expense.invoiceDate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Badge className={`${statusConfig.color} flex-shrink-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {/* Financial summary */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-2 font-bold text-lg text-foreground">{formatCurrency(expense.total)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Base: {formatCurrency(expense.subtotal)} + IVA {(expense.taxRate * 100).toFixed(0)}%
                    </div>
                </div>

                {/* Expandable lines */}
                {expense.lines.length > 0 && (
                    <div>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                        >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expense.lines.length} línea{expense.lines.length !== 1 ? 's' : ''} de factura
                        </button>

                        {expanded && (
                            <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {expense.lines.map(line => (
                                    <div key={line.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-50/50 dark:bg-zinc-800/30">
                                        <div className="flex-1 min-w-0">
                                            <span className="truncate block">{line.description}</span>
                                            {(line.budgetChapter || line.suggestedChapter) && (
                                                <span className="text-indigo-500 text-[10px]">
                                                    📁 {line.budgetChapter || line.suggestedChapter}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium text-foreground ml-3 flex-shrink-0">
                                            {formatCurrency(line.total)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* AI confidence */}
                {expense.extractedByAI && expense.extractionConfidence != null && (
                    <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-muted-foreground">Confianza AI:</span>
                        <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${expense.extractionConfidence * 100}%` }}
                            />
                        </div>
                        <span className="font-medium">{(expense.extractionConfidence * 100).toFixed(0)}%</span>
                    </div>
                )}

                {/* Actions for pending expenses */}
                {expense.status === 'pendiente' && (
                    <div className="flex gap-2 pt-1">
                        <Button
                            size="sm"
                            onClick={handleValidate}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Validar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReject}
                            disabled={loading}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Rechazar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
