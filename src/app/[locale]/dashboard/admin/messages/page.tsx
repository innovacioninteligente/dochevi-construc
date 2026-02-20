
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listAdminConversationsAction } from '@/actions/chat/list-admin-conversations.action';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageSquare, User, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminChatWindow from '@/components/admin/chat/AdminChatWindow';

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadConversations();
        // Polling interval for real-time updates (could be improved with Firestore snapshot listener in future)
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadConversations = async () => {
        try {
            const result = await listAdminConversationsAction(50);
            if (result.success) {
                setConversations(result.conversations || []);
            }
        } catch (error) {
            console.error("Failed to load conversations in admin:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-0 md:p-6 w-full h-full flex flex-col bg-background/50 md:bg-transparent">
            {/* Header - Hidden on Mobile when Chat is Open */}
            <div className={cn("flex justify-between items-center shrink-0 px-4 pt-4 md:p-0", selectedConversationId && "hidden md:flex")}>
                <h1 className="text-xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    Mensajes
                </h1>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-indigo-500/30 text-indigo-400 bg-indigo-500/5 backdrop-blur-sm">
                        {conversations.length}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 flex-1 min-h-0 relative">
                {/* Conversation List Sidebar - Condition: Show if no conversation selected OR is desktop */}
                <div className={cn(
                    "col-span-1 md:col-span-4 lg:col-span-3 h-full overflow-hidden transition-all duration-300 absolute md:relative w-full z-10 bg-background md:bg-transparent",
                    selectedConversationId ? "-translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : "translate-x-0 opacity-100"
                )}>
                    <Card className="h-full border-0 md:border md:border-white/10 bg-transparent md:bg-white/5 md:backdrop-blur-xl flex flex-col shadow-none rounded-none md:rounded-xl">
                        <div className="p-4 border-b border-white/10 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar conversación..."
                                    className="pl-9 bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/10 text-sm focus-visible:ring-indigo-500/50 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="md:p-2 space-y-0 md:space-y-1">
                                {isLoading && conversations.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-10 text-sm">No hay conversaciones</p>
                                ) : (
                                    filteredConversations.map((conv: any) => (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversationId(conv.id)}
                                            className={cn(
                                                "flex flex-col gap-1.5 p-4 md:p-3 cursor-pointer transition-all border-b md:border md:rounded-lg",
                                                "border-black/5 dark:border-white/5 md:border-transparent",
                                                selectedConversationId === conv.id
                                                    ? "bg-indigo-50/50 dark:bg-indigo-500/10 md:border-indigo-500/30 md:shadow-md md:shadow-indigo-500/5"
                                                    : "hover:bg-black/5 dark:hover:bg-white/5 md:hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "font-medium text-sm flex items-center gap-2",
                                                    selectedConversationId === conv.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground/90"
                                                )}>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                        selectedConversationId === conv.id
                                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                                    )}>
                                                        {(conv.leadName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    {conv.leadName || 'Usuario'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-[10px] px-1.5 h-5 font-normal tracking-wide",
                                                        conv.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                            conv.status === 'waiting_for_admin' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                "bg-gray-500/10 text-gray-400"
                                                    )}
                                                >
                                                    {conv.status.replace(/_/g, ' ')}
                                                </Badge>
                                                {conv.unreadCount > 0 && (
                                                    <Badge className="h-5 min-w-5 px-1.5 bg-indigo-500 text-white border-0 shadow-sm shadow-indigo-500/20">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Chat Window Area - Mobile: Slide in from right. Desktop: Static */}
                <div className={cn(
                    "col-span-1 md:col-span-8 lg:col-span-9 h-full min-h-0 absolute md:relative w-full z-20 bg-background md:bg-transparent transition-all duration-300",
                    selectedConversationId ? "translate-x-0 opacity-100" : "translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
                )}>
                    {selectedConversationId ? (
                        <div className="h-full flex flex-col">
                            {/* Mobile Back Button */}
                            <div className="md:hidden p-2 border-b bg-background/95 backdrop-blur flex items-center shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 -ml-2 text-muted-foreground"
                                    onClick={() => setSelectedConversationId(null)}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium text-foreground">Volver</span>
                                </Button>
                            </div>
                            <AdminChatWindow conversationId={selectedConversationId} />
                        </div>
                    ) : (
                        <Card className="hidden md:flex h-full border-white/10 bg-white/5 backdrop-blur-xl flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="p-4 rounded-full bg-indigo-500/10 mb-2">
                                <MessageSquare className="w-10 h-10 text-indigo-400/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-medium text-foreground">Selecciona una conversación</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                    Elige un chat de la lista para ver el historial y responder a los clientes.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
