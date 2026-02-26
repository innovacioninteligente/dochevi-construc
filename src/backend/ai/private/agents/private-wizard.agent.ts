import { ai, gemini25Flash } from '@/backend/ai/core/config/genkit.config';
import { z } from 'zod';
import { processMeasurementDocumentTool } from '../tools/process-measurement-document.tool';
import { generateRenovationRenderTool } from '../tools/generate-renovation-render.tool';

export const PrivateWizardAgentInputSchema = z.object({
    userId: z.string(),
    userMessage: z.string(),
    documentBase64: z.string().optional().describe('Uploaded Measurement Document PDF'),
    imagesBase64: z.array(z.string()).optional().describe("Array of base64 encoded images uploaded by the user"),
    history: z.array(
        z.object({
            role: z.enum(['user', 'model', 'system']),
            content: z.array(z.any())
        })
    ).optional(),
});

export const PrivateWizardOutputSchema = z.object({
    reply: z.string().optional(),
    updatedRequirements: z.object({
        projectScale: z.enum(['minor', 'major', 'unknown']).optional().describe("'major' = structural/extension/change-of-use. 'minor' = interior reform without touching structure."),
        phaseChecklist: z.record(z.enum(['pending', 'addressed', 'not_applicable'])).optional().describe("Track each construction chapter. Keys are chapter names like 'Demoliciones', 'Fontanería'. Values: 'pending' | 'addressed' | 'not_applicable'."),
        activeBatchJobId: z.string().optional(),
        completedBudgetId: z.string().optional(),
        completedBudgetTotal: z.number().optional(),
        completedBudgetItems: z.number().optional(),
        isReadyForGeneration: z.boolean().optional().describe("Set to true ONLY when you have enough information to generate a full budget: scale is classified, all mandatory phases are addressed or marked N/A, and user has confirmed the scope.")
    }).passthrough().optional()
});

export const privateWizardAgent = ai.defineFlow(
    {
        name: 'privateWizardAgent',
        inputSchema: PrivateWizardAgentInputSchema,
    },
    async (input) => {
        console.log(`[PrivateWizardAgent] Processing message from user: ${input.userId}`);

        const systemPrompt = `
Eres el Asistente Privado de Grupo RG Construction. Actúas como un APAREJADOR (Arquitecto Técnico) experto en presupuestación de obras en España.

Tu flujo de trabajo sigue el proceso real de un aparejador profesional. Eres conversacional, técnico y metódico. Haces UNA SOLA PREGUNTA por turno para no abrumar al usuario.

═══════════════════════════════════════════
🏗️ FLUJO DE TRABAJO DEL APAREJADOR (sigue este orden SIEMPRE)
═══════════════════════════════════════════

**FASE 1 — DEFINICIÓN DEL ALCANCE**
Primero entiende QUÉ quiere hacer el usuario. Pregunta:
- ¿Qué tipo de inmueble es? (Vivienda, local, oficina, nave industrial)
- ¿Qué trabajo quiere realizar? (Reforma integral, parcial, obra nueva, rehabilitación de fachada, etc.)
- ¿Cuál es la superficie aproximada en m²?

**FASE 2 — ANÁLISIS DEL ESTADO ACTUAL (Visita técnica virtual)**
Pregunta sobre el estado actual:
- ¿Cuántos años tiene el inmueble? ¿Conoce el estado de las instalaciones (electricidad, fontanería)?
- ¿Hay patologías visibles? (Humedades, grietas, problemas estructurales)
- ¿Se van a mover tabiques o es reforma sin tocar estructura?
- ¿En qué planta está? ¿Tiene ascensor?

**FASE 3 — CLASIFICACIÓN DE ESCALA (CRÍTICO)**
Una vez que tienes la info anterior, clasifica en 'updatedRequirements.projectScale':
- **Obra Mayor** ('major'): Cambios estructurales, ampliaciones, cambio de uso, fachadas estructurales, cubiertas. (Requiere proyecto firmado por arquitecto).
- **Obra Menor** ('minor'): Reforma interior sin tocar estructura (pinturas, solados, alicatados, baños). (Comunicación previa o licencia menor).

Informa al usuario de la clasificación y sus implicaciones legales (licencias, técnico responsable).

**FASE 4 — DESGLOSE POR CAPÍTULOS (phaseChecklist)**
Genera el 'phaseChecklist' con los capítulos técnicos que aplican al proyecto:
- **Obra Mayor siempre incluye**: "Seguridad y Salud" (RD 1627/1997), "Gestión de Residuos" (RD 105/2008), "Trabajos Previos y Demoliciones", "Estructura", "Cubierta".
- **Obra Menor típicamente incluye**: "Protecciones", "Demoliciones y Desmontajes".
- **Comunes**: Albañilería, Revestimientos, Pinturas, Carpintería Interior/Exterior, Fontanería, Electricidad, Climatización, Sanitarios, Limpieza Final.

Para cada capítulo relevante, pregunta detalles específicos para poder presupuestarlo correctamente. Marca como 'addressed' cuando tengas suficiente info, o 'not_applicable' si no aplica.

**FASE 5 — VALIDACIÓN FINAL**
Antes de señalar que estás listo, confirma:
1. Recomienda añadir un 10-15% de contingencias para imprevistos.
2. Recuerda que el presupuesto (si lo crea un admin) quedará sin cliente asignado y deberá usar "Asignar Cliente" después de generarlo.

**CUANDO ESTÁS LISTO**: Cuando todos los capítulos relevantes están 'addressed' o 'not_applicable', has confirmado la escala y el usuario da luz verde para consultar precios, establece 'isReadyForGeneration: true' en updatedRequirements.

═══════════════════════════════════════════
📋 REGLAS DE CONVERSACIÓN Y HERRAMIENTAS
═══════════════════════════════════════════
1. Haz SOLO UNA PREGUNTA por turno.
2. Usa emojis técnicos con moderación (🏗️ 🔧 ⚡ 🚿 🪟).
3. **SI EL USUARIO ADJUNTA UN PDF DE MEDICIONES:** Eres un Supervisor. DEBES utilizar la herramienta 'processMeasurementDocument'. El flujo de extracción preserva INTACTAS las descripciones originales. Si la herramienta responde 'PROCESSING_BACKGROUND', dile al usuario que tardará unos minutos.
4. Tono: profesional, técnico pero accesible.

═══════════════════════════════════════════
⚙️ FORMATO DE RESPUESTA OBLIGATORIO
═══════════════════════════════════════════
Siempre debes contestar con un mensaje de texto normal para el usuario, y AL FINAL DE TU MENSAJE añadir OBLIGATORIAMENTE un bloque de código JSON con las variables actualizadas.
Ejemplo:

[Tu respuesta de texto aquí para el usuario]

\`\`\`json
{
  "specs": {
    "propertyType": "Vivienda",
    "interventionType": "Reforma Integral",
    "totalArea": "90"
  },
  "targetBudget": "15000",
  "urgency": "Alta",
  "projectScale": "major",
  "phaseChecklist": {
    "Demoliciones": "addressed",
    "Fontaneria": "pending"
  },
  "isReadyForGeneration": false
}
\`\`\`
        `;

        let cleanHistory = input.history ? [...input.history] : [];

        // Gemini strictly requires the conversation history to start with a 'user' message.
        // If the chat history starts with a bot greeting ('model'), we remove it from the context we send to the API.
        while (cleanHistory.length > 0 && cleanHistory[0].role !== 'user') {
            cleanHistory.shift();
        }

        const messages: any[] = cleanHistory;

        let finalContextMessage = input.userMessage;
        let activeBatchJobId: string | undefined = undefined;
        let completedBudgetId: string | undefined = undefined;
        let completedBudgetTotal: number | undefined = undefined;
        let completedBudgetItems: number | undefined = undefined;

        // If there's a document context not handled purely by tools but as direct attachment
        if (input.documentBase64) {
            console.log(`[PrivateWizardAgent] Processing attached document programmatically...`);
            finalContextMessage += "\n\n[Sistema: Analizando el documento PDF adjunto...]";

            try {
                const docResult = await processMeasurementDocumentTool({
                    base64Data: input.documentBase64,
                    mimeType: 'application/pdf',
                    fileName: 'mediciones.pdf',
                    leadId: input.userId
                });

                finalContextMessage += `\n[Resultado Herramienta Mediciones]:\n${JSON.stringify(docResult, null, 2)}\n\n(Instrucción: Informa al usuario sobre este resultado. Si el estado es PROCESSING_BACKGROUND, dile que se está procesando y pronto verá los resultados.)`;

                if (docResult.status === 'PROCESSING_BACKGROUND' && docResult.jobId) {
                    activeBatchJobId = docResult.jobId;
                } else if (docResult.status === 'COMPLETED' && docResult.data) {
                    completedBudgetId = docResult.data.id;
                    completedBudgetTotal = docResult.data.total;
                    completedBudgetItems = docResult.data.itemCount;
                }
            } catch (e: any) {
                console.error("[PrivateWizardAgent] Error running measurement tool:", e);
                finalContextMessage += `\n[Error Herramienta Mediciones]: Ocurrió un error leyendo el documento: ${e.message}`;
            }
        }

        // Add the current user message
        const userContent: any[] = [{ text: finalContextMessage }];

        // Add images if present
        if (input.imagesBase64 && input.imagesBase64.length > 0) {
            input.imagesBase64.forEach(imgData => {
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

        let response;
        try {
            response = await ai.generate({
                model: gemini25Flash,
                system: systemPrompt,
                messages: messages,
                tools: [processMeasurementDocumentTool, generateRenovationRenderTool],
                config: { temperature: 0.2 }
            });
        } catch (error: any) {
            console.error(`[PrivateWizardAgent] Generation Error:`, error);
            throw error;
        }

        try {
            const rawText = response.text || "";
            let jsonUpdate = {};

            // Try to extract JSON block from text
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    jsonUpdate = JSON.parse(jsonMatch[1]);
                } catch (e) {
                    console.warn("[PrivateWizardAgent] Failed to parse JSON block from agent", e);
                }
            } else if (response.output) {
                // Fallback if genkit somehow returns structured output anyway
                jsonUpdate = response.output as any;
            }

            // Remove the JSON block from the reply the user sees
            const replyCleaned = rawText.replace(/```json\s*([\s\S]*?)\s*```/g, '').trim();

            return {
                reply: replyCleaned,
                updatedRequirements: {
                    ...jsonUpdate,
                    ...(activeBatchJobId ? { activeBatchJobId } : {}),
                    ...(completedBudgetId ? { completedBudgetId, completedBudgetTotal, completedBudgetItems } : {})
                }
            };
        } catch (error) {
            console.error(`[PrivateWizardAgent] Error:`, error);
            return {
                reply: "Lo siento, ha ocurrido un error al procesar tu solicitud en el servidor privado. Por favor, intenta un poco más tarde."
            };
        }
    }
);
