'use client';

import { ProviderRankingAnalytics } from '@/backend/analytics/analytics-service';
import { MetricCard, DeviationBadge } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, Building2, Receipt, BarChart3 } from 'lucide-react';

interface ProviderRankingPanelProps {
    ranking: ProviderRankingAnalytics;
    locale: string;
}

export function ProviderRankingPanel({ ranking, locale }: ProviderRankingPanelProps) {
    const fmt = (v: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    const isHighRisk = ranking.topProviderRiskPercent > 40;
    const isMedRisk = ranking.topProviderRiskPercent > 25;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold">Ranking de Proveedores</h2>
            </div>

            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    label="Gasto Global"
                    value={fmt(ranking.totalGlobalSpend)}
                    subtext={`${ranking.providers.length} proveedores`}
                    icon={<Receipt className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    label="Proveedores"
                    value={String(ranking.providers.length)}
                    icon={<Users className="w-4 h-4 text-indigo-500" />}
                />
                <MetricCard
                    label="Concentración Top 1"
                    value={`${ranking.topProviderRiskPercent.toFixed(1)}%`}
                    subtext={isHighRisk ? '⚠️ Riesgo alto' : isMedRisk ? '⚡ Riesgo moderado' : '✅ Diversificado'}
                    icon={<AlertTriangle className={`w-4 h-4 ${isHighRisk ? 'text-red-500' : isMedRisk ? 'text-amber-500' : 'text-emerald-500'}`} />}
                    colorClass={isHighRisk ? 'text-red-600' : isMedRisk ? 'text-amber-600' : 'text-emerald-600'}
                />
            </div>

            {/* Provider Table */}
            <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Tabla de Proveedores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {ranking.providers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Proveedor</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Total</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Facturas</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Media</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Obras</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">% Gasto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.providers.map((provider, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="py-3 px-3 text-muted-foreground font-medium">{i + 1}</td>
                                            <td className="py-3 px-3">
                                                <div>
                                                    <span className="font-medium">{provider.providerName}</span>
                                                    {provider.cif && (
                                                        <span className="text-[10px] text-muted-foreground ml-2">{provider.cif}</span>
                                                    )}
                                                </div>
                                                {provider.chapters.length > 0 && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {provider.chapters.slice(0, 3).map((ch, j) => (
                                                            <Badge key={j} variant="outline" className="text-[9px] py-0">
                                                                {ch.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right font-bold">{fmt(provider.totalSpent)}</td>
                                            <td className="py-3 px-3 text-right">{provider.invoiceCount}</td>
                                            <td className="py-3 px-3 text-right text-muted-foreground">{fmt(provider.avgInvoiceAmount)}</td>
                                            <td className="py-3 px-3 text-center">
                                                <Badge variant="outline" className="text-[10px]">{provider.projectCount}</Badge>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${provider.riskPercent > 40 ? 'bg-red-500' :
                                                                    provider.riskPercent > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${Math.min(100, provider.riskPercent)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{provider.riskPercent.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-10">Sin datos de proveedores</p>
                    )}
                </CardContent>
            </Card>

            {/* Risk Visualization */}
            {ranking.providers.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Concentración de Riesgo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {ranking.providers.slice(0, 8).map((provider, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                                    <span className="text-xs font-medium w-32 truncate">{provider.providerName}</span>
                                    <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
                                        <div
                                            className={`h-full rounded-md transition-all duration-700 flex items-center px-2 ${provider.riskPercent > 40 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                                    provider.riskPercent > 25 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                                        'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                }`}
                                            style={{ width: `${Math.max(provider.riskPercent, 3)}%` }}
                                        >
                                            {provider.riskPercent > 10 && (
                                                <span className="text-[9px] font-bold text-white">{fmt(provider.totalSpent)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium w-12 text-right">{provider.riskPercent.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
