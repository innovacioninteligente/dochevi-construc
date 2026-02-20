
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, MoreVertical, Phone, Video, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
// We need an action to get messages for a specific conversation
import { getConversationHistoryAction } from '@/actions/chat/get-conversation-history.action';
import { sendMessageAction } from '@/actions/chat/send-message.action';

interface AdminChatWindowProps {
    conversationId: string;
}

export default function AdminChatWindow({ conversationId }: AdminChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async () => {
        try {
            // We need to implement this action or use the existing one but securely
            const result = await getConversationHistoryAction(conversationId);
            if (result.success) {
                setMessages(result.messages || []);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        if (conversationId) {
            loadMessages();
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [conversationId, loadMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);



    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            // Admin sending message
            await sendMessageAction(conversationId, newMessage, 'admin', 'admin-user');
            setNewMessage('');
            await loadMessages(); // Refresh immediately
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Card className="h-full border-white/10 bg-white/5 backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">U</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm">Usuario (Lead)</h3>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            En línea
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20" ref={scrollRef}>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">
                        Comienza la conversación...
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.sender.type === 'admin';
                        const isSystem = msg.sender.type === 'system' || msg.sender.type === 'assistant';

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full mb-4",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "flex flex-col max-w-[75%]",
                                    isMe ? "items-end" : "items-start"
                                )}>
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 text-sm shadow-md",
                                            isMe
                                                ? "bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-none"
                                                : isSystem
                                                    ? "bg-gray-800/80 border border-white/10 text-gray-200 rounded-bl-none italic"
                                                    : "bg-white/10 border border-white/10 text-foreground rounded-bl-none backdrop-blur-sm"
                                        )}
                                    >
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isSystem && " • AI Assistant"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex items-end gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 shrink-0">
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <textarea
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm resize-none py-2.5 min-h-[44px] max-h-[120px]"
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 shrink-0">
                        <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className={cn(
                            "h-9 w-9 rounded-lg shrink-0 transition-all shadow-lg shadow-indigo-500/20",
                            newMessage.trim()
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
