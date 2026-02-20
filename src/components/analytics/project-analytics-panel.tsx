'use client';

import { ProjectAnalytics } from '@/backend/analytics/analytics-service';
import { HorizontalBarChart, BarChart, MetricCard, DeviationBadge } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp, TrendingDown, Flame, Users, CalendarDays,
    ArrowLeftRight, Building2,
} from 'lucide-react';

interface ProjectAnalyticsPanelProps {
    analytics: ProjectAnalytics;
    locale: string;
}

export function ProjectAnalyticsPanel({ analytics, locale }: ProjectAnalyticsPanelProps) {
    const fmt = (v: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    const isOverBudget = analytics.deviationPercent > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-foreground">{analytics.projectName}</h2>
                    <Badge variant="outline" className="text-xs">{analytics.status}</Badge>
                </div>
                <DeviationBadge percent={analytics.deviationPercent} />
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    label="Presupuesto Estimado"
                    value={fmt(analytics.estimatedBudget)}
                    icon={<ArrowLeftRight className="w-4 h-4 text-indigo-500" />}
                />
                <MetricCard
                    label="Coste Real"
                    value={fmt(analytics.realCost)}
                    icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                    colorClass={isOverBudget ? 'text-red-600' : 'text-emerald-600'}
                />
                <MetricCard
                    label="Margen Bruto"
                    value={fmt(analytics.grossMargin)}
                    icon={analytics.grossMargin >= 0
                        ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                        : <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                    colorClass={analytics.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}
                    trend={analytics.grossMargin >= 0 ? 'up' : 'down'}
                    trendValue={`${Math.abs(analytics.deviationPercent).toFixed(1)}% ${isOverBudget ? 'sobre' : 'bajo'} presupuesto`}
                />
                <MetricCard
                    label="Burn Rate"
                    value={`${fmt(analytics.dailyBurnRate)}/día`}
                    subtext={`${analytics.daysElapsed} días transcurridos`}
                    icon={<Flame className="w-4 h-4 text-amber-500" />}
                />
            </div>

            {/* Phase Comparison + Monthly */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Estimated vs Real by Chapter */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Estimado vs Real por Capítulo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.phaseComparisons.length > 0 ? (
                            <HorizontalBarChart
                                items={analytics.phaseComparisons.map(p => ({
                                    label: p.name,
                                    estimated: p.estimatedCost,
                                    real: p.realCost,
                                }))}
                                formatValue={fmt}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Sin fases disponibles</p>
                        )}
                    </CardContent>
                </Card>

                {/* Monthly Expenses */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Gastos Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.monthlyExpenses.length > 0 ? (
                            <BarChart
                                data={analytics.monthlyExpenses.map(m => ({
                                    label: m.label,
                                    value: m.total,
                                }))}
                                height={180}
                                formatValue={fmt}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Sin datos de gastos</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Providers + Expense Summary */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Providers */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> Top 5 Proveedores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.topProviders.length > 0 ? (
                            <div className="space-y-3">
                                {analytics.topProviders.map((provider, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                                            <span className="text-sm font-medium truncate">{provider.providerName}</span>
                                            <span className="text-[10px] text-muted-foreground">({provider.count} fact.)</span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{fmt(provider.total)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Sin proveedores</p>
                        )}
                    </CardContent>
                </Card>

                {/* Expense counts */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-emerald-500" /> Resumen de Facturas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: 'Total facturas', value: analytics.totalExpenses, color: 'text-foreground' },
                                { label: 'Validadas', value: analytics.validatedExpenses, color: 'text-emerald-600' },
                                { label: 'Pendientes', value: analytics.pendingExpenses, color: 'text-amber-600' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
