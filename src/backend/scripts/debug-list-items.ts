import 'dotenv/config';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

const main = async () => {
    initFirebaseAdminApp();
    const db = getFirestore();

    console.log(`Listing first 10 items...`);

    const snapshot = await db.collection('price_book_items')
        .limit(10)
        .get();

    if (snapshot.empty) {
        console.log("Collection is empty.");
    } else {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`[${data.code}] ${data.priceTotal}€ - ${data.description.substring(0, 50)}...`);
        });
    }
};

main().catch(console.error);
