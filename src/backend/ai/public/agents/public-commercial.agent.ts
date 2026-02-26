import { ai, gemini25Flash } from '@/backend/ai/core/config/genkit.config';
import { z } from 'zod';
import { requestBudgetHandoffTool } from '../tools/request-budget-handoff.tool';

export const PublicCommercialAgentInputSchema = z.object({
    userId: z.string().optional(),
    userMessage: z.string(),
    imagesBase64: z.array(z.string()).optional().describe("Array of base64 encoded images uploaded by the user"),
    history: z.array(
        z.object({
            role: z.enum(['user', 'model', 'system']),
            content: z.array(z.any())
        })
    ).optional(),
});

export const publicCommercialAgent = ai.defineFlow(
    {
        name: 'publicCommercialAgent',
        inputSchema: PublicCommercialAgentInputSchema,
        outputSchema: z.object({
            reply: z.string(),
        }),
    },
    async (input) => {
        console.log(`[PublicCommercialAgent] Processing message from user: ${input.userId || 'Anonymous'}`);

        // Prepare the system prompt explaining the agent's role
        const systemPrompt = `
Eres el Agente Comercial Público de Dochevi Construction.
Tu objetivo principal es:
1. Captar la atención del cliente potencial.
2. Resolver dudas generales sobre Dochevi (somos una constructora tecnológica que usa IA para presupuestar y gestionar obras con total transparencia).
3. Recopilar datos clave para un presupuesto: Nombre, Contacto, Tipo de Obra (Reforma de Baño, Cocina, Integral) y Descripción.
4. Si el usuario sube fotos de la estancia a reformar, analízalas y haz preguntas pertinentes (ej. "Veo que tienes azulejos antiguos, ¿quieres quitarlos o poner encima?").
5. CUANDO TENGAS SUFICIENTE INFORMACIÓN: Utiliza la herramienta 'requestBudgetHandoff' enviando los datos para procesar la estimación oculta en el backend.
6. NUNCA inventes precios exactos por tu cuenta. Siempre depende de la respuesta de la herramienta de Handoff para dar un resumen comercial.

Reglas: Sé persuasivo, profesional, corto en tus respuestas y siempre orienta la conversación hacia la obtención de requisitos para generarles su presupuesto en la plataforma.
`;

        // Assemble history and current message
        const messages: any[] = input.history ? [...input.history] : [];

        // Add the current user message with possible images
        const userContent: any[] = [{ text: input.userMessage }];
        if (input.imagesBase64 && input.imagesBase64.length > 0) {
            input.imagesBase64.forEach(imgData => {
                // Determine mime type heuristically or pass from UI
                const mimeType = imgData.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
                userContent.push({
                    media: {
                        url: `data:${mimeType};base64,${imgData}`,
                        contentType: mimeType
                    }
                });
            });
        }

        messages.push({ role: 'user', content: userContent });

        try {
            // We use standard generate with tools enabled
            const response = await ai.generate({
                model: gemini25Flash,
                system: systemPrompt,
                messages: messages,
                tools: [requestBudgetHandoffTool],
                config: {
                    temperature: 0.4
                }
            });

            return {
                reply: response.text
            };
        } catch (error) {
            console.error(`[PublicCommercialAgent] Error:`, error);
            return {
                reply: "Lo siento, ha ocurrido un error de conexión con nuestros sistemas. ¿Podrías intentar enviar tu mensaje de nuevo?"
            };
        }
    }
);
