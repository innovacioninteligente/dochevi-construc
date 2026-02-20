import { useReducer, useCallback, useEffect } from 'react';
import { BudgetLineItem, BudgetCostBreakdown } from '@/backend/budget/domain/budget';
import { BudgetEditorState, BudgetEditorAction, EditableBudgetLineItem } from '@/types/budget-editor';
// import { arrayMove } from '@dnd-kit/sortable';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial Cost Breakdown Calculator
const calculateBreakdown = (items: EditableBudgetLineItem[]): BudgetCostBreakdown => {
    const materialExecutionPrice = items.reduce((sum, item) => {
        const price = parseFloat(String(item.item?.totalPrice || 0));
        return sum + (isNaN(price) ? 0 : price);
    }, 0);
    const overheadExpenses = materialExecutionPrice * 0.13; // 13% General Expenses
    const industrialBenefit = materialExecutionPrice * 0.06; // 6% Industrial Benefit
    const subtotal = materialExecutionPrice + overheadExpenses + industrialBenefit;
    const tax = subtotal * 0.21; // 21% IVA

    // Round to 2 decimals
    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    return {
        materialExecutionPrice: round(materialExecutionPrice),
        overheadExpenses: round(overheadExpenses),
        industrialBenefit: round(industrialBenefit),
        tax: round(tax),
        globalAdjustment: 0,
        total: round(subtotal + tax)
    };
};

const initialState: BudgetEditorState = {
    items: [],
    chapters: [],
    costBreakdown: {
        materialExecutionPrice: 0,
        overheadExpenses: 0,
        industrialBenefit: 0,
        tax: 0,
        globalAdjustment: 0,
        total: 0
    },
    history: [],
    historyIndex: -1,
    hasUnsavedChanges: false,
    isSaving: false
};

function budgetEditorReducer(state: BudgetEditorState, action: BudgetEditorAction): BudgetEditorState {
    switch (action.type) {
        case 'SET_ITEMS': {
            console.log('[BudgetEditor] SET_ITEMS triggered with', action.payload.length, 'items');
            // Extract unique chapters or default to 'General'
            const newItems = action.payload.map(item => ({
                ...item,
                id: item.id || generateId(),
                isEditing: false,
                isDirty: false,
                chapter: item.chapter || 'General', // Default chapter
                order: item.order || 0, // Ensure order exists
                originalState: item.originalState || (item.item ? {
                    unitPrice: Number(item.item.unitPrice || 0),
                    quantity: Number(item.item.quantity || 0),
                    description: item.item.description || '',
                    unit: item.item.unit || ''
                } : undefined) // Snapshot with strict defaults
            }));

            // Derive unique chapters from items
            const derivedChapters = Array.from(new Set(newItems.map(i => i.chapter).filter(Boolean) as string[]));
            const chapters = derivedChapters.length > 0 ? derivedChapters : ['General'];

            const breakdown = calculateBreakdown(newItems);
            return {
                ...state,
                items: newItems,
                chapters: chapters,
                costBreakdown: breakdown,
                history: [{ items: newItems, timestamp: Date.now() }],
                historyIndex: 0
            };
        }

        case 'ADD_CHAPTER': {
            return {
                ...state,
                chapters: [...state.chapters, action.payload]
            };
        }

        case 'REMOVE_CHAPTER': {
            const chapterToRemove = action.payload;
            const newChapters = state.chapters.filter(c => c !== chapterToRemove);

            // DELETE items in that chapter (User intent: remove cost)
            const newItems = state.items.filter(item => item.chapter !== chapterToRemove);

            // Ensure we have at least 'General' if all chapters removed
            if (newChapters.length === 0 && !newChapters.includes('General')) {
                newChapters.push('General');
            }

            const breakdown = calculateBreakdown(newItems);

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ items: newItems, timestamp: Date.now() });

            return {
                ...state,
                items: newItems,
                chapters: newChapters,
                costBreakdown: breakdown,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'RENAME_CHAPTER': {
            const { oldName, newName } = action.payload;
            const newChapters = state.chapters.map(c => c === oldName ? newName : c);
            const newItems = state.items.map(item =>
                item.chapter === oldName
                    ? { ...item, chapter: newName, isDirty: true }
                    : item
            );

            return {
                ...state,
                items: newItems,
                chapters: newChapters,
                hasUnsavedChanges: true
            };
        }

        case 'REORDER_CHAPTERS': {
            return {
                ...state,
                chapters: action.payload,
                hasUnsavedChanges: true
            };
        }

        case 'UPDATE_ITEM': {
            const newItems = state.items.map(item =>
                item.id === action.payload.id
                    ? { ...item, ...action.payload.changes, isDirty: true }
                    : item
            );

            // Recalculate totals for the updated item if quantity or price changed
            const updatedItems = newItems.map(item => {
                if (item.id === action.payload.id && item.item) {
                    const quantity = item.item.quantity || 0;
                    const unitPrice = item.item.unitPrice || 0;
                    return {
                        ...item,
                        item: {
                            ...item.item,
                            totalPrice: quantity * unitPrice
                        }
                    };
                }
                return item;
            });

            const breakdown = calculateBreakdown(updatedItems);

            // Add to history
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ items: updatedItems, timestamp: Date.now() });

            return {
                ...state,
                items: updatedItems,
                costBreakdown: breakdown,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'REORDER_ITEMS': {
            // Note: In grouped view, REORDER_ITEMS might receive a subset or the whole list.
            // If the UI passes ONLY the modified group, we need to merge.
            // But if we simply update the 'order' of ALL items provided in payload, keeping others intact:

            const payloadItems = action.payload;

            // Create a map for quick lookup of payload items
            const payloadMap = new Map(payloadItems.map((item, index) => [item.id, index]));

            const newItems = state.items.map(item => {
                const payloadIndex = payloadMap.get(item.id);
                if (payloadIndex !== undefined) {
                    // This item is in the reordered payload, update it
                    return {
                        ...payloadItems[payloadIndex],
                        order: payloadIndex + 1 // Or keep relative order logic if needed
                    };
                }
                return item;
            });

            // Wait, if we use Framer Motion per group, 'payload' is just that group's items in new order.
            // We need to merge that back into the main list, respecting the chapter.

            // Actually, for simplicity, let `reorderItems` accept the FULL list if possible, 
            // OR if we pass a chunk, we replace that chunk in the state.

            // STRATEGY: The payload contains the new state of a specific set of items (e.g. a Chapter).
            // We should replace these items in the main state.

            const updatedIds = new Set(payloadItems.map(i => i.id));
            const mergedItems = state.items.map(item => {
                if (updatedIds.has(item.id)) {
                    return payloadItems.find(p => p.id === item.id)!;
                }
                return item;
            });

            // Re-sort based on chapters? No, the order within the chapter is what matters.
            // The payload items should already have their updated 'order' property if we set it before dispatch.
            // IF NOT, we should set it here.

            // Let's assume the payload items come in the correct order.
            // We assign them sequential indices relative to their chapter? 
            // Or just trust the payload order.

            // Simple merge:
            const history = state.history.slice(0, state.historyIndex + 1);
            history.push({ items: mergedItems, timestamp: Date.now() });

            return {
                ...state,
                items: mergedItems,
                history: history,
                historyIndex: history.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'ADD_ITEM': {
            const newItem = {
                ...action.payload,
                id: action.payload.id || generateId(),
                isEditing: false,
                isDirty: true,
                chapter: action.payload.chapter || 'General',
                order: state.items.length + 1
            };

            const newItems = [...state.items, newItem];

            // Ensure chapter exists
            const newChapters = state.chapters.includes(newItem.chapter)
                ? state.chapters
                : [...state.chapters, newItem.chapter];

            const breakdown = calculateBreakdown(newItems);

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ items: newItems, timestamp: Date.now() });

            return {
                ...state,
                items: newItems,
                chapters: newChapters,
                costBreakdown: breakdown,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'DUPLICATE_ITEM': {
            const originalItem = state.items.find(i => i.id === action.payload);
            if (!originalItem) return state;

            const newItem: EditableBudgetLineItem = {
                ...originalItem,
                id: generateId(),
                isDirty: true,
                originalTask: `${originalItem.originalTask} (Copia)`,
                item: originalItem.item ? { ...originalItem.item, description: `${originalItem.item.description}` } : undefined,
                order: originalItem.order + 0.5 // Temporary order, will need re-indexing or splices
            };

            // Insert after original
            const originalIndex = state.items.findIndex(i => i.id === action.payload);
            const newItems = [...state.items];
            newItems.splice(originalIndex + 1, 0, newItem);

            // Re-index orders? Not strictly necessary if we rely on array order, but good practice.
            // Let's just trust array order for now as `reorderItems` handles logic.

            const breakdown = calculateBreakdown(newItems);

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ items: newItems, timestamp: Date.now() });

            return {
                ...state,
                items: newItems,
                costBreakdown: breakdown,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(item => item.id !== action.payload);
            const breakdown = calculateBreakdown(newItems);

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ items: newItems, timestamp: Date.now() });

            return {
                ...state,
                items: newItems,
                costBreakdown: breakdown,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }

        case 'UNDO':
            if (state.historyIndex <= 0) return state;
            const prevVersion = state.history[state.historyIndex - 1];
            return {
                ...state,
                items: prevVersion.items,
                costBreakdown: calculateBreakdown(prevVersion.items),
                historyIndex: state.historyIndex - 1,
                hasUnsavedChanges: true
            };

        case 'REDO':
            if (state.historyIndex >= state.history.length - 1) return state;
            const nextVersion = state.history[state.historyIndex + 1];
            return {
                ...state,
                items: nextVersion.items,
                costBreakdown: calculateBreakdown(nextVersion.items),
                historyIndex: state.historyIndex + 1,
                hasUnsavedChanges: true
            };

        case 'SAVE_START':
            return { ...state, isSaving: true };

        case 'SAVE_SUCCESS':
            return { ...state, isSaving: false, hasUnsavedChanges: false, lastSavedAt: action.payload };

        case 'SAVE_ERROR':
            return { ...state, isSaving: false };

        default:
            return state;
    }
}

export function useBudgetEditor(initialItems: BudgetLineItem[] = []) {
    const [state, dispatch] = useReducer(budgetEditorReducer, initialState);

    // Initialize items or Update if server data changes (e.g. Regeneration)
    useEffect(() => {
        if (initialItems.length > 0) {
            // Check if we really need to update to avoid infinite loops or overwriting unsaved work
            // If user has unsaved changes, we might NOT want to overwrite? 
            // BUT for "Regenerate", we usually want to force it.
            // Let's assume if initialItems count changes significantly or IDs differ, we update.
            // Simple check: If state is empty OR items differ in length/IDs and we don't have unsaved changes.

            const currentIds = new Set(state.items.map(i => i.id));
            const hasNewData = initialItems.some(i => !currentIds.has(i.id || ''));

            if (state.items.length === 0 || (hasNewData && !state.hasUnsavedChanges)) {
                console.log('[useBudgetEditor] Syncing state with new initialItems:', initialItems.length);
                dispatch({ type: 'SET_ITEMS', payload: initialItems as EditableBudgetLineItem[] });
            }
        }
    }, [initialItems, state.items.length, state.hasUnsavedChanges]);

    // Prevent accidental exit with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Standard for modern browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [state.hasUnsavedChanges]);

    const updateItem = useCallback((id: string, changes: Partial<EditableBudgetLineItem>) => {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, changes } });
    }, []);

    const reorderItems = useCallback((newItems: EditableBudgetLineItem[]) => {
        // When reordering a chapter, we receive just that chapter's items in new order.
        // We need to ensure they have the correct 'order' field updated.
        const reindexedItems = newItems.map((item, index) => ({
            ...item,
            order: index + 1 // Reset order for this chunk
        }));
        dispatch({ type: 'REORDER_ITEMS', payload: reindexedItems });
    }, []);

    const addItem = useCallback((item: Partial<EditableBudgetLineItem>) => {
        // Prepare item with defaults
        const newItem: EditableBudgetLineItem = {
            id: generateId(),
            isEditing: false,
            isDirty: true,
            chapter: 'General',
            ...item
        } as EditableBudgetLineItem;

        dispatch({ type: 'ADD_ITEM', payload: newItem });
    }, []);

    const removeItem = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
    }, []);

    const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
    const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

    const saveStart = useCallback(() => dispatch({ type: 'SAVE_START' }), []);
    const saveSuccess = useCallback(() => dispatch({ type: 'SAVE_SUCCESS', payload: new Date() }), []);
    const saveError = useCallback(() => dispatch({ type: 'SAVE_ERROR' }), []);

    // New Actions
    const addChapter = useCallback((name: string) => dispatch({ type: 'ADD_CHAPTER', payload: name }), []);
    const removeChapter = useCallback((name: string) => dispatch({ type: 'REMOVE_CHAPTER', payload: name }), []);
    const renameChapter = useCallback((oldName: string, newName: string) => dispatch({ type: 'RENAME_CHAPTER', payload: { oldName, newName } }), []);
    const reorderChapters = useCallback((newOrder: string[]) => dispatch({ type: 'REORDER_CHAPTERS', payload: newOrder }), []);

    // Feature: Duplicate
    const duplicateItem = useCallback((id: string) => dispatch({ type: 'DUPLICATE_ITEM', payload: id }), []);

    return {
        state,
        updateItem,
        addItem,
        reorderItems,
        removeItem,
        duplicateItem, // Export
        undo,
        redo,
        saveStart,
        saveSuccess,
        saveError,
        canUndo: state.historyIndex > 0,
        canRedo: state.historyIndex < state.history.length - 1,
        // Chapters
        addChapter,
        removeChapter,
        renameChapter,
        reorderChapters
    };
}
