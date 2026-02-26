import { ai } from '@/backend/ai/core/config/genkit.config';
import { z } from 'zod';
import { generateRenderFlow } from '../flows/renovation/generate-render.flow';

export const generateRenovationRenderTool = ai.defineTool(
    {
        name: 'generateRenovationRender',
        description: 'Utiliza esta herramienta para generar un render ("Después") basado en una foto original de una estancia ("Antes") proporcionada por el usuario. Úsala cuando el cliente pida ver cómo quedaría su reforma, o si quieres proponer proactivamente una idea visual de diseño.',
        inputSchema: z.object({
            imageBuffersBase64: z.array(z.string()).describe("Array of Base64 encoded strings of the original images the user uploaded."),
            style: z.string().describe("The design style requested by the user or proposed by you (e.g., 'Modern Minimalist', 'Rustic Wood', 'Industrial')."),
            roomType: z.string().describe("The type of room (e.g., 'Bathroom', 'Kitchen', 'Living Room')."),
            additionalRequirements: z.string().optional().describe("Any specific details to include in the render (e.g., 'freestanding tub', 'dark cabinets').")
        }),
        outputSchema: z.object({
            status: z.enum(['COMPLETED', 'ERROR']),
            message: z.string(),
            generatedImageBase64: z.string().optional()
        })
    },
    async (input) => {
        console.log(`[Render Tool] Generating render for ${input.roomType} in ${input.style} style.`);
        try {
            const result = await generateRenderFlow({
                imageBuffers: input.imageBuffersBase64,
                style: input.style,
                roomType: input.roomType,
                additionalRequirements: input.additionalRequirements
            });

            return {
                status: 'COMPLETED' as const,
                message: 'Render generado exitosamente. Muestra este resultado al usuario con entusiasmo.',
                generatedImageBase64: result.generatedImage
            };
        } catch (error: any) {
            console.error("[Render Tool] Error generating render:", error);
            return {
                status: 'ERROR' as const,
                message: 'Error al generar el render. Informa al usuario que hubo un problema técnico.'
            };
        }
    }
);
