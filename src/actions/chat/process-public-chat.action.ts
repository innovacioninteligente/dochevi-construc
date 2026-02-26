'use server';

import { publicCommercialAgent } from '@/backend/ai/public/agents/public-commercial.agent';

export async function processPublicChatAction(
    message: string,
    history: any[],
    base64Files?: string[],
    userId?: string
) {
    try {
        // Filter out PDFs (which start with JVBER) since this agent only handles images for now
        const imagesBase64 = base64Files?.filter(b64 => !b64.startsWith('JVBER'));

        const result = await publicCommercialAgent({
            userMessage: message,
            history,
            imagesBase64: imagesBase64?.length ? imagesBase64 : undefined,
            userId,
        });

        return { success: true, response: result.reply, isComplete: false, updatedRequirements: {} };
    } catch (error) {
        console.error("Error processing public client message:", error);
        return { success: false, error: "Failed to process message" };
    }
}
