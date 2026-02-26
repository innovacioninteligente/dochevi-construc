'use server';

import { ai } from '@/backend/ai/core/config/genkit.config';
import { constructionAnalystAgent } from '@/backend/ai/private/agents/construction-analyst.agent';
import { z } from 'zod';

/**
 * Estimates a unit price for a simplified description using AI.
 * Fast, approximate, for quick budgeting.
 */
export async function estimatePriceAction(description: string): Promise<{ success: boolean; price?: number; confidence?: number; reason?: string; error?: string }> {
    try {
        if (!description) return { success: false, error: "Description is empty" };

        const prompt = `
            Estimate the Execution Cost (Material + Labor) for a single unit of this construction task: "${description}".
            Location: Spain. 
            Market rates: 2024.
            
            Return ONLY a number (Euro). If unsure, estimate based on standard database rates.
            Output JSON: { "price": number, "confidence": number (0-1), "reason": "brief explanation" }
        `;

        const result = await ai.generate({
            model: 'googleai/gemini-1.5-flash', // Fast model
            prompt: prompt,
            output: { format: 'json' }
        });

        const output = result.output as any;
        return {
            success: true,
            price: output.price,
            confidence: output.confidence,
            reason: output.reason
        };

    } catch (error: any) {
        console.error("Estimate Price Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Generates a full breakdown (descompuesto) for an item by invoking the Construction Analyst Agent.
 * This effectively converts a simple line item into a complex Partida.
 */
export async function generateBreakdownAction(description: string, leadId?: string) {
    try {
        if (!description) return { success: false, error: "Description is empty" };

        console.log(`[SmartActions] Breaking down: ${description}`);

        // Reuse the Agents Logic!
        const result = await constructionAnalystAgent({
            description: description,
            leadId: leadId
        });

        // The agent returns 'items' (list of subtasks).
        // If we want a breakdown for a SINGLE item, we might get multiple items if the description implies multiple tasks.
        // But usually "Alicatado de baño" -> [Alicatado, Lechada, ...]
        // If the user selected ONE row and asked for breakdown, they might expect that row to become a group or have sub-items.
        // For now, we return the list of items the agent generated.
        // The frontend will decide if it replaces the single item with these items, or adds them as children.

        return { success: true, items: result.items };

    } catch (error: any) {
        console.error("Generate Breakdown Error:", error);
        return { success: false, error: error.message };
    }
}
