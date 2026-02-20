'use client';

import { useState } from 'react';
import { Budget } from '@/backend/budget/domain/budget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createProjectAction } from '@/actions/project/create-project.action';
import { HardHat, FileText, Euro, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    approvedBudgets: Budget[];
    locale: string;
}

export function CreateProjectModal({ open, onOpenChange, approvedBudgets, locale }: CreateProjectModalProps) {
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [startDate, setStartDate] = useState('');
    const [estimatedEndDate, setEstimatedEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedBudget = approvedBudgets.find(b => b.id === selectedBudgetId);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

    const handleSubmit = async () => {
        if (!selectedBudgetId) {
            setError('Selecciona un presupuesto');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createProjectAction({
                budgetId: selectedBudgetId,
                name: name || undefined,
                description: description || undefined,
                address: address || undefined,
                startDate: startDate || undefined,
                estimatedEndDate: estimatedEndDate || undefined,
            });

            if (result.success) {
                onOpenChange(false);
                resetForm();
            } else {
                setError(result.error || 'Error al crear la obra');
            }
        } catch (err) {
            setError('Error inesperado al crear la obra');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedBudgetId(null);
        setName('');
        setDescription('');
        setAddress('');
        setStartDate('');
        setEstimatedEndDate('');
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <HardHat className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Nueva Obra
                    </DialogTitle>
                    <DialogDescription>
                        Crea un nuevo proyecto de obra a partir de un presupuesto aprobado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Budget selector */}
                    <div className="space-y-2">
                        <Label className="font-semibold">Presupuesto aprobado *</Label>
                        {approvedBudgets.length === 0 ? (
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                No hay presupuestos aprobados disponibles. Aprueba un presupuesto primero.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 p-2">
                                {approvedBudgets.map(budget => (
                                    <button
                                        key={budget.id}
                                        type="button"
                                        onClick={() => setSelectedBudgetId(budget.id)}
                                        className={`w-full text-left rounded-lg p-3 transition-all duration-200 border ${selectedBudgetId === budget.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/30'
                                                : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">
                                                    {budget.clientSnapshot?.name || `Presupuesto ${budget.id.slice(0, 8)}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    <Euro className="w-3 h-3 mr-1" />
                                                    {formatCurrency(budget.totalEstimated || budget.costBreakdown?.total || 0)}
                                                </Badge>
                                            </div>
                                        </div>
                                        {budget.type && (
                                            <span className="text-xs text-muted-foreground mt-1 block capitalize">{budget.type.replace('_', ' ')}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Project details */}
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Nombre de la obra</Label>
                        <Input
                            id="project-name"
                            placeholder={selectedBudget ? `Obra - ${selectedBudget.clientSnapshot?.name || ''}` : 'Nombre del proyecto'}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-address">Dirección</Label>
                        <Input
                            id="project-address"
                            placeholder="Calle, número, ciudad"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-description">Descripción (opcional)</Label>
                        <Textarea
                            id="project-description"
                            placeholder="Breve descripción de la obra..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Fecha de inicio</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Fecha estimada fin</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={estimatedEndDate}
                                onChange={e => setEstimatedEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedBudgetId}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <HardHat className="w-4 h-4 mr-2" />
                                Crear Obra
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
