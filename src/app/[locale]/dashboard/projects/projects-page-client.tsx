'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, ProjectStatus } from '@/backend/project/domain/project';
import { Budget } from '@/backend/budget/domain/budget';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    HardHat, Plus, Filter, Building2, Sparkles, Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'preparacion', label: 'Preparación' },
    { value: 'ejecucion', label: 'En Ejecución' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cerrada', label: 'Cerrada' },
];

interface ProjectsPageClientProps {
    projects: Project[];
    approvedBudgets: Budget[];
    locale: string;
}

export function ProjectsPageClient({ projects, approvedBudgets, locale }: ProjectsPageClientProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesSearch = searchQuery === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientSnapshot?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

    const totalEstimated = projects.reduce((acc, p) => acc + p.estimatedBudget, 0);
    const totalReal = projects.reduce((acc, p) => acc + p.realCost, 0);
    const activeProjects = projects.filter(p => p.status === 'ejecucion').length;

    return (
        <div className="h-full overflow-y-auto overflow-x-hidden w-full p-3 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-5 md:p-8 text-white shadow-2xl mx-1 md:mx-0">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <Badge className="bg-white/10 text-indigo-200 hover:bg-white/20 border-indigo-500/30 backdrop-blur-md mb-2">
                            <Building2 className="w-3 h-3 mr-1 text-indigo-300" /> Gestión de Obras
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
                            Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">Obras</span>
                        </h1>
                        <p className="text-indigo-100/70 max-w-xl text-lg">
                            Gestiona el ciclo de vida de tus proyectos de construcción, desde la preparación hasta el cierre.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-white text-indigo-900 hover:bg-indigo-50 border-none shadow-lg shadow-purple-900/30 font-semibold transition-all duration-300 group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Nueva Obra
                    </Button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: 'Total Obras', value: projects.length, icon: Building2, color: 'blue' },
                    { label: 'En Ejecución', value: activeProjects, icon: HardHat, color: 'emerald' },
                    { label: 'Presupuestado', value: formatCurrency(totalEstimated), icon: Sparkles, color: 'purple' },
                    { label: 'Coste Real', value: formatCurrency(totalReal), icon: Filter, color: 'amber' },
                ].map(metric => (
                    <div
                        key={metric.label}
                        className={`rounded-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-all duration-300`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900/20`}>
                                <metric.icon className={`w-4 h-4 text-${metric.color}-500`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="text-lg font-bold text-foreground">{metric.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar obra..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(filter => (
                        <Button
                            key={filter.value}
                            variant={statusFilter === filter.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(filter.value)}
                            className={statusFilter === filter.value
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                            }
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 pb-8 px-1 md:px-0">
                    {filteredProjects.map(project => (
                        <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
                            <ProjectCard
                                project={project}
                                locale={locale}
                            />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                        <HardHat className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                            {projects.length === 0 ? 'Sin obras todavía' : 'Sin resultados'}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {projects.length === 0
                                ? 'Crea tu primera obra a partir de un presupuesto aprobado para comenzar a gestionar tus proyectos.'
                                : 'No se encontraron obras con los filtros seleccionados.'
                            }
                        </p>
                    </div>
                    {projects.length === 0 && (
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primera Obra
                        </Button>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <CreateProjectModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                approvedBudgets={approvedBudgets}
                locale={locale}
            />
        </div>
    );
}
