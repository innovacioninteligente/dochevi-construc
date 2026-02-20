'use client';

import { MonthlyExpense, PhaseComparison, ProviderBreakdown } from '@/backend/analytics/analytics-service';

// ---- Bar Chart (Vertical) ----

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    maxValue?: number;
    height?: number;
    formatValue?: (v: number) => string;
}

export function BarChart({ data, maxValue, height = 200, formatValue }: BarChartProps) {
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    const fmt = formatValue || ((v: number) => v.toLocaleString());

    return (
        <div className="flex items-end gap-2" style={{ height }}>
            {data.map((item, i) => {
                const barHeight = max > 0 ? (item.value / max) * 100 : 0;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            {fmt(item.value)}
                        </span>
                        <div
                            className="w-full rounded-t-md transition-all duration-500 ease-out group-hover:opacity-80"
                            style={{
                                height: `${barHeight}%`,
                                minHeight: item.value > 0 ? 4 : 0,
                                background: item.color || 'linear-gradient(to top, #6366f1, #8b5cf6)',
                            }}
                        />
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-1">
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ---- Horizontal Bar Chart (for comparisons) ----

interface HorizontalBarChartProps {
    items: {
        label: string;
        estimated: number;
        real: number;
    }[];
    formatValue?: (v: number) => string;
}

export function HorizontalBarChart({ items, formatValue }: HorizontalBarChartProps) {
    const max = Math.max(...items.flatMap(i => [i.estimated, i.real]), 1);
    const fmt = formatValue || ((v: number) => v.toLocaleString());

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[50%]">{item.label}</span>
                        <span className="text-muted-foreground">
                            {fmt(item.real)} / {fmt(item.estimated)}
                        </span>
                    </div>
                    <div className="relative h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        {/* Estimated bar (background) */}
                        <div
                            className="absolute inset-y-0 left-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"
                            style={{ width: `${(item.estimated / max) * 100}%` }}
                        />
                        {/* Real bar (foreground) */}
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${item.real > item.estimated
                                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                                    : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                }`}
                            style={{ width: `${(item.real / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
            {/* Legend */}
            <div className="flex gap-4 text-[10px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-200 dark:bg-indigo-800" /> Estimado
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Real (OK)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> Real (Desviado)
                </span>
            </div>
        </div>
    );
}

// ---- Donut Chart ----

interface DonutChartProps {
    segments: { label: string; value: number; color: string }[];
    centerLabel?: string;
    centerValue?: string;
    size?: number;
}

export function DonutChart({ segments, centerLabel, centerValue, size = 140 }: DonutChartProps) {
    const total = segments.reduce((acc, s) => acc + s.value, 0);
    let cumulativePercent = 0;

    const gradientStops = segments.map(segment => {
        const start = cumulativePercent;
        const percent = total > 0 ? (segment.value / total) * 100 : 0;
        cumulativePercent += percent;
        return `${segment.color} ${start}% ${cumulativePercent}%`;
    });

    const background = total > 0
        ? `conic-gradient(${gradientStops.join(', ')})`
        : 'conic-gradient(#e5e7eb 0% 100%)';

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="rounded-full relative"
                style={{ width: size, height: size, background }}
            >
                <div
                    className="absolute rounded-full bg-white dark:bg-zinc-900 flex flex-col items-center justify-center"
                    style={{
                        width: size * 0.6,
                        height: size * 0.6,
                        top: size * 0.2,
                        left: size * 0.2,
                    }}
                >
                    {centerValue && <span className="text-lg font-bold text-foreground">{centerValue}</span>}
                    {centerLabel && <span className="text-[9px] text-muted-foreground">{centerLabel}</span>}
                </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {segments.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ---- Metric Card ----

interface MetricCardProps {
    label: string;
    value: string;
    subtext?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass?: string;
}

export function MetricCard({ label, value, subtext, icon, trend, trendValue, colorClass = 'text-foreground' }: MetricCardProps) {
    return (
        <div className="rounded-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
                    {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
                </div>
                <div className="p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/50">
                    {icon}
                </div>
            </div>
            {trend && trendValue && (
                <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </div>
            )}
        </div>
    );
}

// ---- Deviation Badge ----

export function DeviationBadge({ percent }: { percent: number }) {
    const isOver = percent > 0;
    const isWarning = Math.abs(percent) > 5;
    const isDanger = Math.abs(percent) > 15;

    const colorClass = isDanger
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : isWarning
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
            {isOver ? '+' : ''}{percent.toFixed(1)}%
        </span>
    );
}
