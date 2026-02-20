'use client';

import { Project, ProjectStatus } from '@/backend/project/domain/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Euro, Clock, Users, ChevronRight } from 'lucide-react';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
    preparacion: { label: 'Preparación', color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700' },
    ejecucion: { label: 'En Ejecución', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700' },
    pausada: { label: 'Pausada', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' },
    finalizada: { label: 'Finalizada', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700' },
    cerrada: { label: 'Cerrada', color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700' },
};

interface ProjectCardProps {
    project: Project;
    locale: string;
    onClick?: () => void;
}

export function ProjectCard({ project, locale, onClick }: ProjectCardProps) {
    const statusCfg = STATUS_CONFIG[project.status];

    const totalPhases = project.phases.length;
    const completedPhases = project.phases.filter(p => p.status === 'completada').length;
    const overallProgress = totalPhases > 0
        ? Math.round(project.phases.reduce((acc, p) => acc + p.progress, 0) / totalPhases)
        : 0;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
            date instanceof Date ? date : new Date(date)
        );
    };

    const budgetUsedPercent = project.estimatedBudget > 0
        ? Math.round((project.realCost / project.estimatedBudget) * 100)
        : 0;

    const getHealth = () => {
        if (project.status === 'finalizada' || project.status === 'cerrada') return { status: 'good', color: 'bg-emerald-500', text: 'En tiempo' };

        const now = new Date();
        const end = project.estimatedEndDate ? new Date(project.estimatedEndDate) : null;
        const isOverdue = end && now > end;
        const isOverBudget = project.estimatedBudget > 0 && project.realCost > project.estimatedBudget;

        if (isOverdue || isOverBudget) return { status: 'critical', color: 'bg-red-500', text: 'Crítico' };

        // Warning if > 90% budget used but progress < 90% (heuristic) or near deadline
        const timeWarning = end && (end.getTime() - now.getTime()) < (1000 * 60 * 60 * 24 * 7); // 1 week
        const budgetWarning = project.estimatedBudget > 0 && (project.realCost / project.estimatedBudget) > 0.9 && overallProgress < 90;

        if (timeWarning || budgetWarning) return { status: 'warning', color: 'bg-amber-500', text: 'Atención' };

        return { status: 'good', color: 'bg-emerald-500', text: 'Saludable' };
    };

    const health = getHealth();

    return (
        <Card
            className="group relative overflow-hidden border-none shadow-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${project.status === 'ejecucion' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                project.status === 'preparacion' ? 'bg-gradient-to-r from-sky-400 to-sky-600' :
                    project.status === 'pausada' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        project.status === 'finalizada' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                            'bg-zinc-300 dark:bg-zinc-700'
                }`} />

            <CardHeader className="relative z-10 pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-bold tracking-tight truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                {project.name}
                            </CardTitle>
                            {/* Health Dot */}
                            <div className={`w-2.5 h-2.5 rounded-full ${health.color} ring-2 ring-white dark:ring-zinc-900 shadow-sm`} title={`Salud: ${health.text}`} />
                        </div>
                        {project.address && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{project.address}</span>
                            </div>
                        )}
                    </div>
                    <Badge className={`${statusCfg.bg} ${statusCfg.color} border shrink-0 text-xs font-medium`}>
                        {statusCfg.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso general</span>
                        <span className="font-semibold text-foreground">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                        {completedPhases}/{totalPhases} fases completadas
                    </div>
                </div>

                {/* Financial summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Euro className="w-3 h-3" />
                            Presupuesto
                        </div>
                        <div className="text-sm font-bold text-foreground">
                            {formatCurrency(project.estimatedBudget)}
                        </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Euro className="w-3 h-3" />
                            Coste real
                        </div>
                        <div className={`text-sm font-bold ${budgetUsedPercent > 90 ? 'text-red-600' : budgetUsedPercent > 70 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                            {formatCurrency(project.realCost)}
                        </div>
                    </div>
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.startDate)}
                        </div>
                        {project.team.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {project.team.length}
                            </div>
                        )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
            </CardContent>
        </Card>
    );
}
