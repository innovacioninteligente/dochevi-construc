import { useState, useEffect, useRef } from 'react';
import { BudgetRequirement } from '@/backend/budget/domain/budget-requirements';
import { useWidgetContext } from '@/context/budget-widget-context';

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
    attachments?: string[];
};

export type WizardState = 'idle' | 'listening' | 'processing' | 'generating' | 'review';

export const useBudgetWizard = (mode: 'public' | 'private' = 'public') => {
    const { leadId } = useWidgetContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [state, setState] = useState<WizardState>('idle');
    const [requirements, setRequirements] = useState<Partial<BudgetRequirement>>({});
    const [conversationId, setConversationId] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    // Load Conversation History
    useEffect(() => {
        if (!leadId || hasLoadedRef.current) return;

        const loadHistory = async () => {
            try {
                const { getConversationAction } = await import('@/actions/chat/get-conversation.action');
                const result = await getConversationAction(leadId);

                if (result.success && result.messages) {
                    setConversationId(result.conversationId || null);

                    if (result.messages.length > 0) {
                        const history = result.messages.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                            createdAt: new Date(m.createdAt),
                            attachments: m.attachments
                        }));
                        setMessages(history);
                    } else {
                        // Set default welcome message if no history
                        setMessages([{
                            id: 'welcome',
                            role: 'assistant',
                            content: "Hola, soy tu arquitecto virtual. Cuéntame, ¿qué proyecto de reforma tienes en mente? Puedes enviarme audios, fotos o planos.",
                            createdAt: new Date(),
                        }]);
                    }
                }
            } catch (error) {
                console.error("Failed to load conversation:", error);
            } finally {
                hasLoadedRef.current = true;
            }
        };

        loadHistory();
    }, [leadId]);

    const sendMessage = async (text: string, attachments: string[] = [], base64Files?: string[], llmTextOverride?: string) => {
        if ((!text.trim() && attachments.length === 0 && (!base64Files || base64Files.length === 0)) || !conversationId || !leadId) return;

        // Optimistic Update
        const tempId = Date.now().toString();
        const userMsg: Message = {
            id: tempId,
            role: 'user',
            content: text,
            createdAt: new Date(),
            attachments
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setState('processing');

        try {
            // 1. Persist User Message
            const { sendMessageAction } = await import('@/actions/chat/send-message.action');
            await sendMessageAction(conversationId, text, 'lead', leadId, attachments);

            // 2. Process AI Response
            await processAIResponse(llmTextOverride || text, base64Files);

        } catch (error) {
            console.error("Failed to send message:", error);
            setState('idle');
            // Revert optimistic update? Or show error state on message
        }
    };

    const processHiddenMessage = async (context: string) => {
        if (!conversationId || !leadId) return;
        setState('processing');
        // Hidden messages are system events or context injections, 
        // strictly speaking they might not need to be 'user' messages in the chat history visible to user,
        // but for the AI context they are valid.
        // For persistence, we might want to save them as 'system' messages or just pass them to AI flow.
        await processAIResponse(context, [], true);
    };

    const processAIResponse = async (text: string, base64Files?: string[], isHidden: boolean = false) => {
        if (!conversationId) return;

        try {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                content: [{ text: m.content }]
            }));

            let result;

            if (mode === 'public') {
                const { processPublicChatAction } = await import('@/actions/chat/process-public-chat.action');
                result = await processPublicChatAction(text, history, base64Files, leadId ?? undefined);
            } else {
                const { processPrivateChatAction } = await import('@/actions/chat/process-private-chat.action');
                result = await processPrivateChatAction(text, history, base64Files, leadId ?? undefined);
            }

            if (result.success) {
                const replyText = result.response || "Entendido. Estoy procesando tu solicitud.";
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: replyText,
                    createdAt: new Date(),
                };

                setMessages(prev => [...prev, aiMsg]);

                // Track requirements state (primarily for private mode, public handles it generically)
                if (result.updatedRequirements) {
                    setRequirements(result.updatedRequirements);
                }

                // Persist AI Message
                const { sendMessageAction } = await import('@/actions/chat/send-message.action');
                await sendMessageAction(conversationId, replyText, 'assistant', 'system');

                if (result.isComplete && mode === 'private') {
                    setState('review');
                } else {
                    setState('idle');
                }
            } else {
                console.error("AI Error:", result.error);
                setState('idle');
            }
        } catch (error) {
            console.error("Failed to process AI response", error);
            setState('idle');
        }
    };

    return {
        messages,
        input,
        setInput,
        sendMessage,
        processHiddenMessage,
        state,
        requirements
    };
};
