'use server';

import { analyzeAttachmentsFlow } from '@/backend/ai/public/flows/analyze-attachments.flow';

export async function processAttachmentsAction(formData: FormData) {
    try {
        const files = formData.getAll('files') as File[];
        if (!files || files.length === 0) throw new Error("No files provided");

        const processedFiles = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return {
                base64: buffer.toString('base64'),
                mimeType: file.type || 'application/octet-stream',
            };
        }));

        const result = await analyzeAttachmentsFlow({
            files: processedFiles,
        });

        return { success: true, analysis: result.analysis };
    } catch (error: any) {
        console.error("Attachment processing error:", error);
        return { success: false, error: error.message };
    }
}
