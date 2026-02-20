import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Hammer, Ruler, Home, Layers, Clock, Wallet } from 'lucide-react';
import { BudgetRequirement } from '@/backend/budget/domain/budget-requirements';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequirementCardProps {
    requirements: Partial<BudgetRequirement>;
    className?: string;
}

export function RequirementCard({ requirements, className }: RequirementCardProps) {
    const hasData = Object.keys(requirements).length > 0;

    if (!hasData) {
        return (
            <div className={cn("rounded-xl border border-dashed border-border/40 dark:border-white/10 bg-background/40 dark:bg-white/5 p-8 text-center", className)}>
                <p className="text-sm text-muted-foreground dark:text-white/40">
                    Aquí verás cómo la IA estructura tu solicitud en tiempo real.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className={cn("h-full pr-4", className)}>
            <div className="space-y-6">
                {/* Key Metrics Grid */}
                <MetricItem
                    icon={Home}
                    label="Tipo"
                    value={requirements.specs?.propertyType ? translateType(requirements.specs.propertyType) : '-'}
                    filled={!!requirements.specs?.propertyType}
                />
                <MetricItem
                    icon={Layers}
                    label="Alcance"
                    value={requirements.specs?.interventionType ? translateScope(requirements.specs.interventionType) : '-'}
                    filled={!!requirements.specs?.interventionType}
                />
                <MetricItem
                    icon={Ruler}
                    label="Superficie"
                    value={requirements.specs?.totalArea ? `${requirements.specs.totalArea} m²` : '-'}
                    filled={!!requirements.specs?.totalArea}
                />
                <MetricItem
                    icon={Wallet}
                    label="Presupuesto"
                    value={requirements.targetBudget || '-'}
                    filled={!!requirements.targetBudget}
                />
                <MetricItem
                    icon={Clock}
                    label="Urgencia"
                    value={requirements.urgency || '-'}
                    filled={!!requirements.urgency}
                />
            </div>

            {/* Detected Needs List */}
            {requirements.detectedNeeds && requirements.detectedNeeds.length > 0 && (
                <div className="space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-white/50">Partidas Identificadas</h5>
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {requirements.detectedNeeds.map((need, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/50 dark:border-white/10 bg-background/50 dark:bg-white/5 px-3 py-1 text-xs text-foreground dark:text-white/80"
                                >
                                    <Check className="h-3 w-3 text-amber-500" />
                                    {need.category}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Quality Badge (Optional) */}
            {requirements.specs?.qualityLevel && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                        Calidad: {translateQuality(requirements.specs.qualityLevel)}
                    </span>
                </div>
            )}
        </ScrollArea >
    );
}

function MetricItem({ icon: Icon, label, value, filled }: any) {
    return (
        <div className={cn(
            "flex flex-col gap-1 rounded-lg border p-3 transition-colors",
            filled
                ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                : "border-border/30 dark:border-white/5 bg-background/30 dark:bg-white/5"
        )}>
            <div className="flex items-center gap-2 text-muted-foreground dark:text-white/40">
                <Icon className={cn("h-3.5 w-3.5", filled && "text-amber-500")} />
                <span className="text-[10px] uppercase tracking-wide">{label}</span>
            </div>
            <span className={cn(
                "font-medium text-sm truncate",
                filled ? "text-foreground dark:text-white" : "text-muted-foreground/50 dark:text-white/20"
            )}>
                {value}
            </span>
        </div>
    );
}

// Helpers
function translateType(type: string) {
    const map: any = { residential: 'Vivienda', commercial: 'Local', office: 'Oficina' };
    return map[type] || type;
}
function translateScope(scope: string) {
    const map: any = { integral: 'Integral', partial: 'Parcial', kitchen: 'Cocina', bathroom: 'Baño' };
    return map[scope] || scope;
}
function translateQuality(quality: string) {
    const map: any = { basic: 'Básica', medium: 'Media', premium: 'Premium', luxury: 'Lujo' };
    return map[quality] || quality;
}
