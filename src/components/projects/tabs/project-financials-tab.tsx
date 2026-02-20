'use client';

import { Project } from '@/backend/project/domain/project';
import { Expense } from '@/backend/expense/domain/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCard } from '@/components/expenses/expense-card';
import { Receipt, AlertTriangle } from 'lucide-react';

interface ProjectFinancialsTabProps {
    project: Project;
    expenses: Expense[];
    locale: string;
}

export function ProjectFinancialsTab({ project, expenses, locale }: ProjectFinancialsTabProps) {
    const totalExpenses = expenses.reduce((acc, e) => acc + e.total, 0);
    const budgetUsage = project.estimatedBudget > 0 ? (totalExpenses / project.estimatedBudget) * 100 : 0;

    const fmt = (v: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{fmt(project.estimatedBudget)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Reales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalExpenses > project.estimatedBudget ? 'text-red-500' : 'text-foreground'}`}>
                            {fmt(totalExpenses)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Margen Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${project.estimatedBudget - totalExpenses < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {fmt(project.estimatedBudget - totalExpenses)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Historial de Gastos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {expenses.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {expenses.map(expense => (
                                <ExpenseCard key={expense.id} expense={expense} locale={locale} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Receipt className="w-10 h-10 mb-2 opacity-20" />
                            <p>No hay gastos registrados para esta obra.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
