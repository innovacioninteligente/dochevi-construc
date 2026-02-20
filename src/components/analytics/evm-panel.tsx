'use client';

import { EVMAnalytics } from '@/backend/analytics/analytics-service';
import { MetricCard, BarChart } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp, TrendingDown, Activity, Target,
    Gauge, CalendarClock, ArrowUpDown,
} from 'lucide-react';

interface EVMPanelProps {
    evm: EVMAnalytics;
    locale: string;
}

const SPI_STATUS_MAP = {
    ahead: { label: 'Adelantado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    on_track: { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    behind: { label: 'Retrasado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const CPI_STATUS_MAP = {
    under_budget: { label: 'Bajo Presupuesto', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    on_budget: { label: 'En Presupuesto', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    over_budget: { label: 'Sobre Presupuesto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function EVMPanel({ evm, locale }: EVMPanelProps) {
    const fmt = (v: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    const spiConfig = SPI_STATUS_MAP[evm.spiStatus];
    const cpiConfig = CPI_STATUS_MAP[evm.cpiStatus];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold">Earned Value — {evm.projectName}</h2>
                <Badge className={spiConfig.color}>{spiConfig.label}</Badge>
                <Badge className={cpiConfig.color}>{cpiConfig.label}</Badge>
            </div>

            {/* Index Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <MetricCard
                    label="SPI"
                    value={evm.spi.toFixed(2)}
                    subtext="Schedule Perf. Index"
                    icon={<CalendarClock className="w-4 h-4 text-blue-500" />}
                    colorClass={evm.spi >= 1 ? 'text-emerald-600' : 'text-red-600'}
                />
                <MetricCard
                    label="CPI"
                    value={evm.cpi.toFixed(2)}
                    subtext="Cost Perf. Index"
                    icon={<Gauge className="w-4 h-4 text-purple-500" />}
                    colorClass={evm.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}
                />
                <MetricCard
                    label="EAC"
                    value={fmt(evm.eac)}
                    subtext="Coste estimado final"
                    icon={<Target className="w-4 h-4 text-amber-500" />}
                    colorClass={evm.eac <= evm.estimatedBudget ? 'text-emerald-600' : 'text-red-600'}
                />
                <MetricCard
                    label="ETC"
                    value={fmt(evm.etc)}
                    subtext="Pendiente de gastar"
                    icon={<ArrowUpDown className="w-4 h-4 text-indigo-500" />}
                />
                <MetricCard
                    label="VAC"
                    value={fmt(evm.vac)}
                    subtext="Varianza a completar"
                    icon={evm.vac >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    colorClass={evm.vac >= 0 ? 'text-emerald-600' : 'text-red-600'}
                />
                <MetricCard
                    label="Presupuesto"
                    value={fmt(evm.estimatedBudget)}
                    subtext="Budget at Completion"
                    icon={<Target className="w-4 h-4 text-zinc-500" />}
                />
            </div>

            {/* PV / EV / AC current */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Planned Value (PV)</p>
                        <p className="text-xl font-bold text-blue-600">{fmt(evm.currentPV)}</p>
                        <p className="text-[10px] text-muted-foreground">Cuánto deberías haber gastado</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Earned Value (EV)</p>
                        <p className="text-xl font-bold text-emerald-600">{fmt(evm.currentEV)}</p>
                        <p className="text-[10px] text-muted-foreground">Valor del trabajo completado</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Actual Cost (AC)</p>
                        <p className="text-xl font-bold text-amber-600">{fmt(evm.currentAC)}</p>
                        <p className="text-[10px] text-muted-foreground">Lo que realmente has gastado</p>
                    </CardContent>
                </Card>
            </div>

            {/* Curva S */}
            {evm.curvaS.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Curva S — Evolución Temporal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Chart visualization using stacked bars */}
                            <div className="flex items-end gap-1.5" style={{ height: 220 }}>
                                {evm.curvaS.map((point, i) => {
                                    const max = Math.max(...evm.curvaS.flatMap(p => [p.plannedValue, p.earnedValue, p.actualCost]), 1);
                                    const pvH = (point.plannedValue / max) * 100;
                                    const evH = (point.earnedValue / max) * 100;
                                    const acH = (point.actualCost / max) * 100;

                                    return (
                                        <div key={i} className="flex-1 flex items-end gap-0.5 group relative">
                                            {/* Tooltip */}
                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-zinc-900 text-white text-[9px] rounded-lg p-2 whitespace-nowrap shadow-lg">
                                                <div>PV: {fmt(point.plannedValue)}</div>
                                                <div>EV: {fmt(point.earnedValue)}</div>
                                                <div>AC: {fmt(point.actualCost)}</div>
                                            </div>
                                            <div
                                                className="flex-1 rounded-t-sm bg-blue-400/60 transition-all"
                                                style={{ height: `${pvH}%`, minHeight: point.plannedValue > 0 ? 2 : 0 }}
                                            />
                                            <div
                                                className="flex-1 rounded-t-sm bg-emerald-500 transition-all"
                                                style={{ height: `${evH}%`, minHeight: point.earnedValue > 0 ? 2 : 0 }}
                                            />
                                            <div
                                                className="flex-1 rounded-t-sm bg-amber-500/80 transition-all"
                                                style={{ height: `${acH}%`, minHeight: point.actualCost > 0 ? 2 : 0 }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            {/* X-axis labels */}
                            <div className="flex gap-1.5">
                                {evm.curvaS.map((point, i) => (
                                    <span key={i} className="flex-1 text-[8px] text-muted-foreground text-center truncate">
                                        {point.label}
                                    </span>
                                ))}
                            </div>
                            {/* Legend */}
                            <div className="flex gap-4 text-[10px] text-muted-foreground justify-center">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> PV (Planificado)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> EV (Ganado)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> AC (Real)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
