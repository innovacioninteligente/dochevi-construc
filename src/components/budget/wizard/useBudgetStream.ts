import { useEffect, useRef, useState } from 'react';
import { useWidgetContext } from '@/context/budget-widget-context';

export type GenerationEvent = {
    type: 'subtasks_extracted' | 'item_resolving' | 'item_resolved' | 'validation_start' | 'complete' | 'error' |
    'chapter_start' | 'decomposition_start' | 'vector_search' | 'batch_progress';
    leadId: string;
    data: any;
    timestamp: number;
};

export function useBudgetStream() {
    const { leadId } = useWidgetContext();
    const eventSourceRef = useRef<EventSource | null>(null);
    const processedEvents = useRef<Set<number>>(new Set());
    const [events, setEvents] = useState<GenerationEvent[]>([]);

    useEffect(() => {
        if (!leadId) return;

        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `/api/budget/stream?leadId=${leadId}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const parsed: GenerationEvent = JSON.parse(event.data);

                if (processedEvents.current.has(parsed.timestamp)) return;
                processedEvents.current.add(parsed.timestamp);

                setEvents(prev => [...prev.slice(-49), parsed]); // Keep last 50 events
            } catch (e) {
                // Ignore parse errors or heartbeats
            }
        };

        es.onerror = (err) => {
            console.error("[BudgetStream] Connection error:", err);
        };

        return () => {
            es.close();
            setEvents([]);
        };
    }, [leadId]);

    const clearEvents = () => setEvents([]);

    return { events, clearEvents };
}
