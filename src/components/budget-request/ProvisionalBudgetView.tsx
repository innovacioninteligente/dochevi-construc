import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, Download, Share2, RotateCw, Loader2 } from 'lucide-react';
import { DetailedFormValues } from './schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BudgetDocument } from '@/components/pdf/BudgetDocument';

interface BudgetCostBreakdown {
    materialExecutionPrice: number;
    overheadExpenses: number;
    industrialBenefit: number;
    tax: number;
    globalAdjustment: number;
    total: number;
}

interface BudgetLineItem {
    order: number;
    originalTask: string;
    found: boolean;
    item?: {
        code: string;
        description: string;
        unit: string;
        price?: number; // kept for legacy
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
    };
    note?: string;
}

interface ProvisionalBudgetViewProps {
    data: DetailedFormValues;
    lineItems: BudgetLineItem[];
    totalEstimated: number;
    costBreakdown?: BudgetCostBreakdown;
    onRestart: () => void;
}

export const ProvisionalBudgetView = ({ data, lineItems, totalEstimated, costBreakdown, onRestart }: ProvisionalBudgetViewProps) => {
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-700">

            {/* Success Banner */}
            <div className="text-center space-y-2 mb-8">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-headline">¡Solicitud Procesada con Éxito!</h2>
                <p className="text-muted-foreground">Hemos generado un borrador preliminar basado en tus necesidades.</p>
            </div>

            {/* The "Invoice" Paper */}
            <Card className="border-0 shadow-2xl overflow-hidden print:shadow-none bg-white">
                {/* Header Ribbon */}
                <div className="bg-primary/5 border-b p-8 flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="font-bold text-2xl tracking-tight text-primary">Propuesta Técnica</h3>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Ref: PRE-{Math.floor(Math.random() * 10000)}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="font-medium">{today}</p>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Borrador Inicial</Badge>
                    </div>
                </div>

                <CardContent className="p-8 space-y-8">

                    {/* Client Info Grid */}
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</span>
                            <div className="font-medium text-base">{data.name}</div>
                            <div className="text-muted-foreground">{data.email}</div>
                            <div className="text-muted-foreground">{data.phone}</div>
                        </div>
                        <div className="space-y-2 text-right">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ubicación Obra</span>
                            <div className="font-medium text-base capitalize">{data.propertyType === 'residential' ? 'Vivienda' : 'Local'}</div>
                            <div className="text-muted-foreground">{data.address || "Dirección facilitada"}</div>
                            <div className="text-muted-foreground">{data.totalAreaM2} m² - {data.projectScope === 'integral' ? 'Reforma Integral' : 'Reforma Parcial'}</div>
                        </div>
                    </div>

                    <Separator />

                    {/* Subtasks List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                <h4 className="font-bold text-lg">Partidas Presupuestarias</h4>
                            </div>
                        </div>

                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {lineItems.map((line) => (
                                    <div key={line.order} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">

                                        {/* Header: Found vs Not Found */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs font-mono text-muted-foreground bg-white border px-1.5 py-0.5 rounded">
                                                    {line.order.toString().padStart(2, '0')}
                                                </span>
                                                <p className="text-sm font-medium text-foreground/90">{line.originalTask}</p>
                                            </div>
                                            {line.found ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 shrink-0 font-normal">
                                                    {line.item?.quantity && line.item?.unitPrice ? (
                                                        <>
                                                            <span className="font-mono text-xs mr-2 text-green-700/70 border-r border-green-200 pr-2">
                                                                {line.item.quantity} {line.item.unit} x {line.item.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                                            </span>
                                                            <span className="font-bold">
                                                                {(line.item.totalPrice || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        /* Legacy Fallback */
                                                        `${(line.item?.price || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`
                                                    )}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 shrink-0">
                                                    Pendiente Valorar
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Technical Description (if found) */}
                                        {line.found && line.item && (
                                            <div className="pl-8 text-xs text-muted-foreground border-l-2 border-primary/20 ml-2">
                                                <p className="line-clamp-2">{line.item.description}</p>
                                                <p className="mt-1 font-mono text-[10px] text-primary/70">Ref: {line.item.code}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <Separator />

                    {/* Cost Breakdown */}
                    {costBreakdown ? (
                        <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                            <h4 className="font-bold text-lg mb-4 text-slate-800">Resumen Económico</h4>

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Ejecución Material (PEM)</span>
                                <span>{costBreakdown.materialExecutionPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-500 pl-4 border-l-2 border-slate-200">
                                <span>Gastos Generales</span>
                                <span>{costBreakdown.overheadExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-500 pl-4 border-l-2 border-slate-200">
                                <span>Beneficio Industrial</span>
                                <span>{costBreakdown.industrialBenefit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>

                            <div className="pt-2 border-t flex justify-between font-medium text-slate-700">
                                <span>Subtotal</span>
                                <span>{(costBreakdown.materialExecutionPrice + costBreakdown.overheadExpenses + costBreakdown.industrialBenefit).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>IVA</span>
                                <span>{costBreakdown.tax.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>

                            {costBreakdown.globalAdjustment !== 0 && (
                                <div className="flex justify-between text-xs text-amber-600 italic">
                                    <span>Ajuste Global</span>
                                    <span>{costBreakdown.globalAdjustment.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t-2 border-primary/20 flex justify-between items-end mt-2">
                                <span className="font-bold text-lg text-primary">Total Presupuesto</span>
                                <span className="font-bold text-2xl text-primary">{costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                        </div>
                    ) : (
                        /* Fallback for old data or simple view */
                        <div className="flex justify-end pt-4">
                            <div className="text-right">
                                <span className="text-sm text-muted-foreground mr-2">Estimación Base:</span>
                                <span className="font-bold text-xl text-primary">{totalEstimated.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <PDFDownloadLink
                    document={
                        <BudgetDocument
                            budgetNumber={`2026-${Math.floor(Math.random() * 10000)}`}
                            clientName={data.name}
                            clientEmail={data.email}
                            clientAddress={data.address}
                            items={lineItems}
                            costBreakdown={costBreakdown || {
                                materialExecutionPrice: 0,
                                overheadExpenses: 0,
                                industrialBenefit: 0,
                                tax: 0,
                                globalAdjustment: 0,
                                total: totalEstimated
                            }}
                            date={today}
                        />
                    }
                    fileName={`Presupuesto-Dochevi-${today.replace(/\//g, '-')}.pdf`}
                    className="inline-flex"
                >
                    {({ blob, url, loading, error }) => (
                        <Button variant="outline" className="gap-2" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {loading ? 'Generando PDF...' : 'Guardar PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
                <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" /> Compartir
                </Button>
                <Button onClick={onRestart} className="gap-2 min-w-[140px]">
                    <RotateCw className="w-4 h-4" /> Nueva Consulta
                </Button>
            </div>

        </div>
    );
};
