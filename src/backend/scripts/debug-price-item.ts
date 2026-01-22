import 'dotenv/config'; // Load env vars
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

const main = async () => {
    const args = process.argv.slice(2);
    const code = args[0];

    if (!code) {
        console.error("Please provide a price code (e.g. RIS030)");
        process.exit(1);
    }

    initFirebaseAdminApp();
    const db = getFirestore();

    console.log(`Searching for item with code: ${code}...`);

    const snapshot = await db.collection('price_book_items')
        .where('code', '==', code)
        .limit(1)
        .get();

    if (snapshot.empty) {
        console.log("No item found with that code.");
    } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        if (data.embedding) data.embedding = "[HIDDEN_VECTOR]";
        console.log("Found item:");
        console.log(JSON.stringify(data, null, 2));
    }
};

main().catch(console.error);
