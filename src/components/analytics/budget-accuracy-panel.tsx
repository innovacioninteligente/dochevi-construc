'use client';

import { BudgetAccuracyAnalytics } from '@/backend/analytics/analytics-service';
import { MetricCard, DeviationBadge, HorizontalBarChart } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Target, Award, AlertTriangle, TrendingUp, TrendingDown,
    BarChart3, BookOpen,
} from 'lucide-react';

interface BudgetAccuracyPanelProps {
    accuracy: BudgetAccuracyAnalytics;
    locale: string;
}

export function BudgetAccuracyPanel({ accuracy, locale }: BudgetAccuracyPanelProps) {
    const fmt = (v: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    const avgIsOk = Math.abs(accuracy.avgDeviationPercent) < 10;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold">Precisión de Presupuestos</h2>
                <Badge variant="outline" className="text-xs">
                    {accuracy.entries.length} obra{accuracy.entries.length !== 1 ? 's' : ''} analizadas
                </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    label="Desviación Media"
                    value={`${accuracy.avgDeviationPercent >= 0 ? '+' : ''}${accuracy.avgDeviationPercent.toFixed(1)}%`}
                    subtext={avgIsOk ? 'Presupuestos precisos' : 'Necesita calibración'}
                    icon={<Target className={`w-4 h-4 ${avgIsOk ? 'text-emerald-500' : 'text-amber-500'}`} />}
                    colorClass={avgIsOk ? 'text-emerald-600' : 'text-amber-600'}
                />
                <MetricCard
                    label="Desviación Mediana"
                    value={`${accuracy.medianDeviationPercent >= 0 ? '+' : ''}${accuracy.medianDeviationPercent.toFixed(1)}%`}
                    subtext="Valor central"
                    icon={<BarChart3 className="w-4 h-4 text-purple-500" />}
                />
                {accuracy.bestProject && (
                    <MetricCard
                        label="Mejor Precisión"
                        value={accuracy.bestProject.name}
                        subtext={`${accuracy.bestProject.deviation >= 0 ? '+' : ''}${accuracy.bestProject.deviation.toFixed(1)}%`}
                        icon={<Award className="w-4 h-4 text-emerald-500" />}
                        colorClass="text-emerald-600"
                    />
                )}
                {accuracy.worstProject && (
                    <MetricCard
                        label="Peor Precisión"
                        value={accuracy.worstProject.name}
                        subtext={`${accuracy.worstProject.deviation >= 0 ? '+' : ''}${accuracy.worstProject.deviation.toFixed(1)}%`}
                        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                        colorClass="text-red-600"
                    />
                )}
            </div>

            {/* Projects Table */}
            {accuracy.entries.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" /> Historial por Obra
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Obra</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Estado</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Estimado</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Real</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Desviación</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Precisión</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accuracy.entries.map(entry => (
                                        <tr
                                            key={entry.projectId}
                                            className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="py-3 px-3 font-medium">{entry.projectName}</td>
                                            <td className="py-3 px-3">
                                                <Badge variant="outline" className="text-[10px]">{entry.status}</Badge>
                                            </td>
                                            <td className="py-3 px-3 text-right">{fmt(entry.estimated)}</td>
                                            <td className="py-3 px-3 text-right font-medium">{fmt(entry.real)}</td>
                                            <td className="py-3 px-3 text-right">
                                                <DeviationBadge percent={entry.deviationPercent} />
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="flex justify-center">
                                                    <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${Math.abs(entry.deviationPercent) < 5 ? 'bg-emerald-500' :
                                                                    Math.abs(entry.deviationPercent) < 15 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${Math.max(5, 100 - Math.abs(entry.deviationPercent))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Chapter Accuracy */}
            {accuracy.chapterAccuracies.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-500" /> Precisión por Capítulo
                            <span className="text-[10px] font-normal text-muted-foreground">(media histórica de todas las obras)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {accuracy.chapterAccuracies.map((ch, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs font-medium w-36 truncate">{ch.chapter}</span>
                                    <div className="flex-1 relative h-5">
                                        {/* Center line (0%) */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-600" />
                                        <div className="absolute inset-0 flex items-center">
                                            <div
                                                className={`h-4 rounded-sm transition-all duration-700 absolute ${ch.avgDeviation >= 0
                                                        ? 'left-1/2 bg-gradient-to-r from-amber-400 to-red-400'
                                                        : 'right-1/2 bg-gradient-to-l from-emerald-400 to-blue-400'
                                                    }`}
                                                style={{
                                                    width: `${Math.min(45, Math.abs(ch.avgDeviation) * 1.5)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-20 text-right">
                                        <DeviationBadge percent={ch.avgDeviation} />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground w-16 text-right">
                                        {ch.count} obra{ch.count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                            {/* Axis labels */}
                            <div className="flex text-[9px] text-muted-foreground mt-1">
                                <span className="flex-1 text-left">← Bajo presupuesto</span>
                                <span>0%</span>
                                <span className="flex-1 text-right">Sobre presupuesto →</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {accuracy.entries.length === 0 && (
                <div className="text-center py-16 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                        <Target className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Sin datos de precisión</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Se necesitan obras con gastos validados para analizar la precisión de los presupuestos.
                    </p>
                </div>
            )}
        </div>
    );
}
