'use client';

import { useState } from 'react';
import { Expense, ExpenseStatus } from '@/backend/expense/domain/expense';
import { Project } from '@/backend/project/domain/project';
import { ExpenseCard } from '@/components/expenses/expense-card';
import { CreateExpenseModal } from '@/components/expenses/create-expense-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Receipt, Plus, Search, TrendingUp, Clock,
    CheckCircle2, XCircle, Sparkles, Filter,
} from 'lucide-react';

const STATUS_FILTERS: { value: ExpenseStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'validada', label: 'Validadas' },
    { value: 'rechazada', label: 'Rechazadas' },
];

interface ExpensesPageClientProps {
    expenses: Expense[];
    projects: Project[];
    locale: string;
}

export function ExpensesPageClient({ expenses, projects, locale }: ExpensesPageClientProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredExpenses = expenses.filter(e => {
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        const matchesProject = projectFilter === 'all' || e.projectId === projectFilter;
        const matchesSearch = searchQuery === '' ||
            e.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesProject && matchesSearch;
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

    const totalPendiente = expenses.filter(e => e.status === 'pendiente').reduce((acc, e) => acc + e.total, 0);
    const totalValidada = expenses.filter(e => e.status === 'validada').reduce((acc, e) => acc + e.total, 0);
    const totalRechazada = expenses.filter(e => e.status === 'rechazada').reduce((acc, e) => acc + e.total, 0);
    const aiExtracted = expenses.filter(e => e.extractedByAI).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <Badge className="bg-white/10 text-emerald-200 hover:bg-white/20 border-emerald-500/30 backdrop-blur-md mb-2">
                            <Receipt className="w-3 h-3 mr-1 text-emerald-300" /> Inbox de Facturas
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
                            Gastos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">Facturas</span>
                        </h1>
                        <p className="text-emerald-100/70 max-w-xl text-lg">
                            Registra, valida y categoriza las facturas de tus obras. Sube un PDF y deja que la IA extraiga los datos.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-white text-emerald-900 hover:bg-emerald-50 border-none shadow-lg shadow-teal-900/30 font-semibold transition-all duration-300 group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Nueva Factura
                    </Button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: 'Pendientes', value: formatCurrency(totalPendiente), count: expenses.filter(e => e.status === 'pendiente').length, icon: Clock, color: 'amber' },
                    { label: 'Validadas', value: formatCurrency(totalValidada), count: expenses.filter(e => e.status === 'validada').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Rechazadas', value: formatCurrency(totalRechazada), count: expenses.filter(e => e.status === 'rechazada').length, icon: XCircle, color: 'red' },
                    { label: 'Extraídas por AI', value: `${aiExtracted} facturas`, count: aiExtracted, icon: Sparkles, color: 'purple' },
                ].map(metric => (
                    <div
                        key={metric.label}
                        className="rounded-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900/20`}>
                                <metric.icon className={`w-4 h-4 text-${metric.color}-500`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="text-lg font-bold text-foreground">{metric.value}</p>
                                <p className="text-[10px] text-muted-foreground">{metric.count} factura{metric.count !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por proveedor o nº factura..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <select
                    className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                    value={projectFilter}
                    onChange={e => setProjectFilter(e.target.value)}
                >
                    <option value="all">Todas las obras</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(filter => (
                        <Button
                            key={filter.value}
                            variant={statusFilter === filter.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(filter.value)}
                            className={statusFilter === filter.value
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Expenses Grid */}
            {filteredExpenses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredExpenses.map(expense => (
                        <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            locale={locale}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                        <Receipt className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                            {expenses.length === 0 ? 'Sin facturas todavía' : 'Sin resultados'}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {expenses.length === 0
                                ? 'Sube tu primera factura o regístrala manualmente para comenzar a controlar los costes.'
                                : 'No se encontraron facturas con los filtros seleccionados.'
                            }
                        </p>
                    </div>
                    {expenses.length === 0 && (
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Registrar Primera Factura
                        </Button>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <CreateExpenseModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                projects={projects}
                locale={locale}
            />
        </div>
    );
}
