'use client';

import { Project } from '@/backend/project/domain/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

interface ProjectTeamTabProps {
    project: Project;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Equipo del Proyecto</CardTitle>
                <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Añadir Miembro
                </Button>
            </CardHeader>
            <CardContent>
                {project.team.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {project.team.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Avatar>
                                    <AvatarFallback>{member.role[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">Miembro {member.id.substring(0, 4)}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay miembros asignados a este proyecto.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
