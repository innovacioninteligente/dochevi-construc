'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BudgetConfig } from "@/backend/budget/domain/budget-config"
import { saveBudgetConfigAction } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    overheadExpenses: z.coerce.number().min(0).max(100),
    industrialBenefit: z.coerce.number().min(0).max(100),
    iva: z.coerce.number().min(0).max(100),
    globalAdjustmentFactor: z.coerce.number().min(0.1),
    baseIntegralReformRateM2: z.coerce.number().positive(),
})

interface BudgetConfigFormProps {
    initialConfig: BudgetConfig;
}

export function BudgetConfigForm({ initialConfig }: BudgetConfigFormProps) {
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false);

    // Convert decimal (0.13) to percentage (13) for display
    const defaultValues = {
        overheadExpenses: (initialConfig.overheadExpenses || 0) * 100,
        industrialBenefit: (initialConfig.industrialBenefit || 0) * 100,
        iva: (initialConfig.iva || 0) * 100,
        globalAdjustmentFactor: initialConfig.globalAdjustmentFactor || 1,
        baseIntegralReformRateM2: initialConfig.baseIntegralReformRateM2 || 650,
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        try {
            // Convert percentage back to decimal
            const configToSave: BudgetConfig = {
                ...initialConfig,
                overheadExpenses: values.overheadExpenses / 100,
                industrialBenefit: values.industrialBenefit / 100,
                iva: values.iva / 100,
                globalAdjustmentFactor: values.globalAdjustmentFactor,
                baseIntegralReformRateM2: values.baseIntegralReformRateM2,
                updatedAt: new Date(),
            };

            await saveBudgetConfigAction(configToSave);
            toast({
                title: "Configuración guardada",
                description: "Los parámetros de cálculo han sido actualizados correctamente.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Parámetros de Cálculo</CardTitle>
                <CardDescription>Define los márgenes, impuestos y tarifas base que se aplicarán a los presupuestos generados.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormField
                                control={form.control}
                                name="overheadExpenses"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gastos Generales (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Costes indirectos de empresa (Oficina, Seguros, Admin). Habitual: 13-17%.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="industrialBenefit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Beneficio Industrial (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Margen de beneficio neto esperado. Habitual: 6% (mínimo) a 15-20% (comercial).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="iva"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IVA (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            10% para reformas de vivienda habitual, 21% general.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="globalAdjustmentFactor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Factor de Ajuste Global (x)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.05" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Multiplicador final al precio total. 1.0 = Sin ajuste. 1.1 = +10%.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="baseIntegralReformRateM2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tarifa Base Reforma Integral (€/m²)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="10" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Precio de referencia para estimaciones rápidas de &quot;paquete completo&quot; (ej: 650€/m²).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Configuración
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
