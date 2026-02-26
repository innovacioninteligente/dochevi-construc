'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Loader2, Check } from 'lucide-react';
import { getAdminLeadsAction } from '@/actions/lead/get-admin-leads.action';
import { createAdminLeadAction } from '@/actions/lead/create-admin-lead.action';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonalInfo } from '@/backend/lead/domain/lead';

interface AssignLeadDialogProps {
    currentLeadId?: string;
    currentClientName?: string;
    onAssignLead: (leadId: string, clientSnapshot: PersonalInfo) => Promise<void>;
}

export function AssignLeadDialog({ currentLeadId, currentClientName, onAssignLead }: AssignLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // New Lead Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (open) {
            fetchLeads('');
        }
    }, [open]);

    const fetchLeads = async (query: string) => {
        setIsLoading(true);
        const res = await getAdminLeadsAction(query);
        if (res.success && res.leads) {
            setLeads(res.leads);
        }
        setIsLoading(false);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        // Basic debounce could be added here, but for MVP eager fetch is okay
        fetchLeads(q);
    };

    const handleSelectExisting = async (lead: any) => {
        try {
            await onAssignLead(lead.id, {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                address: lead.address
            });
            toast({ title: "Cliente asignado", description: "El presupuesto se ha vinculado correctamente." });
            setOpen(false);
        } catch (e) {
            toast({ title: "Error", description: "No se pudo asignar el cliente.", variant: "destructive" });
        }
    };

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const res = await createAdminLeadAction({
            name: newName,
            email: newEmail,
            phone: newPhone,
            address: newAddress
        });

        if (res.success && res.lead) {
            try {
                await onAssignLead(res.lead.id, {
                    name: res.lead.name,
                    email: res.lead.email,
                    phone: res.lead.phone,
                    address: res.lead.address
                });
                toast({ title: "Cliente creado y asignado", description: "El nuevo cliente se ha vinculado al presupuesto." });
                setOpen(false);
                // Reset form
                setNewName(''); setNewEmail(''); setNewPhone(''); setNewAddress('');
            } catch (err) {
                toast({ title: "Error", description: "No se pudo vincular el presupuesto.", variant: "destructive" });
            }
        } else {
            toast({ title: "Error", description: res.error || "No se pudo crear el cliente.", variant: "destructive" });
        }
        setIsCreating(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden md:inline">
                        {currentClientName && currentClientName !== 'Desconocido' ? currentClientName : 'Asignar Cliente'}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Asignar Cliente al Presupuesto</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="search" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search">Buscar Existente</TabsTrigger>
                        <TabsTrigger value="new">Crear Nuevo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por nombre, email o teléfono..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                        <ScrollArea className="h-[250px] rounded-md border p-2">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full text-slate-500">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="text-center text-sm text-slate-500 mt-10">
                                    No se encontraron clientes.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leads.map((lead) => (
                                        <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-semibold text-sm truncate">{lead.name}</span>
                                                <span className="text-xs text-slate-500 truncate">{lead.email}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={currentLeadId === lead.id ? "secondary" : "default"}
                                                onClick={() => handleSelectExisting(lead)}
                                                disabled={currentLeadId === lead.id}
                                            >
                                                {currentLeadId === lead.id ? <Check className="w-4 h-4" /> : 'Seleccionar'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="new" className="py-4">
                        <form onSubmit={handleCreateNew} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo *</Label>
                                <Input id="name" required value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <Input id="email" type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono *</Label>
                                <Input id="phone" type="tel" required value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección / NIF (Opcional)</Label>
                                <Input id="address" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Datos de facturación..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={isCreating}>
                                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                {isCreating ? 'Guardando...' : 'Crear y Asignar'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
