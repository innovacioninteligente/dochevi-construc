
import 'dotenv/config';
import { generateBudgetRecurseFlow } from '@/backend/ai/private/flows/generate-budget-recurse.flow';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

async function runTest() {
    console.log('🚀 Starting Full RAG Flow Verification...');
    initFirebaseAdminApp();

    // The problematic prompt that was previously generating 0 matches or hallucinations
    const input = `
    Quiero hacer una reforma integral de un piso de 90m2. 
Estado actual: 4 habitaciones, 1 baño antiguo y cocina cerrada.
Nueva distribución: Quiero dejarlo en 3 habitaciones (una tipo suite con baño), un segundo baño completo y abrir la cocina al salón.
Especificaciones técnicas:
- Demoliciones: Tirar toda la tabiquería interior, levantar el suelo de terrazo antiguo y picar alicatados de cocina y baño.
- Albañilería: Tabiquería nueva de Pladur con aislamiento de lana de roca. Falso techo continúo en toda la casa.
- Instalaciones:
  - Fontanería nueva completa para los 2 baños y cocina.
  - Electricidad nueva: cuadro nuevo, recableado y mecanismos niessen.
  - Climatización: Aire acondicionado por conductos con máquina incluida.
- Acabados:
  - Suelo: Tarima flotante laminada AC5 color roble natural.
  - Paredes: Alisado de paredes y pintura plástica blanca mate.
  - Baños: Alicatado porcelánico rectificado en zonas húmedas y resto pintura. Platos de ducha de resina y grifería empotrada.
- Carpintería:
  - 7 Puertas de paso macizas lacadas en blanco.
  - 5 Ventanas de PVC con doble acristalamiento y persianas motorizadas.
- Cocina: Mobiliario en L, muebles lacados blanco mate y encimera porcelánica.
    `;

    console.log(`\nInput Prompt:\n${input}\n`);

    // Context needed for the flow
    const context = "Piso planta baja, fácil acceso.";

    try {
        console.log(">> Calling generateBudgetRecurseFlow...");
        const result = await generateBudgetRecurseFlow({
            projectDescription: input,
            leadId: 'test-full-rag-flow',
            totalArea: 40,
            projectContext: context
        });

        console.log('\n--- Full Flow Result ---\n');

        if (result.chapters && result.chapters.length > 0) {
            let totalItems = 0;
            let totalVerified = 0;
            let totalPending = 0;

            result.chapters.forEach((chapter: any) => {
                console.log(`\n📂 Chapter: ${chapter.name}`);
                if (chapter.items && chapter.items.length > 0) {
                    chapter.items.forEach((item: any) => {
                        totalItems++;
                        const isVerified = item.matchConfidence > 60 && item.unitPrice > 0;
                        if (isVerified) totalVerified++;
                        else totalPending++;

                        console.log(`   - [${isVerified ? '✅' : '⚠'}] ${item.description}`);
                        console.log(`     Price: ${item.totalPrice}€ | Conf: ${item.matchConfidence}%`);
                        if (item.note) console.log(`     Note: ${item.note}`);
                    });
                } else {
                    console.log("   (No items in chapter)");
                }
            });

            console.log(`\nSUMMARY: Total: ${totalItems} | Verified: ${totalVerified} | Pending: ${totalPending}`);

            if (totalVerified > 0) {
                console.log("✅ SUCCESS: The flow is generating verified items!");
            } else {
                console.log("❌ FAILURE: No verified items found. RAG might still be too strict or failing.");
            }

        } else {
            console.log('\n❌ FAILURE: No chapters generated.');
        }

    } catch (error) {
        console.error('❌ Error executing flow:', error);
    }
}

runTest();
