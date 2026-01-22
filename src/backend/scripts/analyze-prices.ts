import 'dotenv/config';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

const main = async () => {
    initFirebaseAdminApp();
    const db = getFirestore();

    console.log(`Analyzing price discrepancies...`);

    const snapshot = await db.collection('price_book_items').get();
    let countTotal = 0;
    let countSuspicious = 0;
    let countX100 = 0;

    snapshot.docs.forEach(doc => {
        countTotal++;
        const data = doc.data();
        const storedPrice = data.priceTotal;
        const description = data.description || "";

        // extraction regex for price in description: " 14,50 " or " 14,50€"
        // European format: comma decimal
        const priceRegex = /[:\s](\d+,\d{2})\s?€/i;
        const match = description.match(priceRegex);

        if (match) {
            const priceStr = match[1].replace(',', '.');
            const descPrice = parseFloat(priceStr);

            if (descPrice > 0) {
                const ratio = storedPrice / descPrice;

                // Check if ratio is close to 100 (allow small float error)
                if (ratio > 90 && ratio < 110) {
                    countX100++;
                    console.log(`[X100 DETECTED] ${data.code}: Stored=${storedPrice}, Desc=${descPrice} (Ratio=${ratio.toFixed(2)})`);
                } else if (ratio > 1.1 || ratio < 0.9) {
                    // console.log(`[MISMATCH] ${data.code}: Stored=${storedPrice}, Desc=${descPrice} (Ratio=${ratio.toFixed(2)})`);
                }
            }
        }
    });

    console.log(`Total: ${countTotal}`);
    console.log(`Suspicious (x100): ${countX100}`);
};

main().catch(console.error);
