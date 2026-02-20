
import { adminAuth } from '@/backend/shared/infrastructure/firebase/admin-app';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: ts-node set-admin-claim.ts <email>');
        process.exit(1);
    }

    try {
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.setCustomUserClaims(user.uid, { admin: true });
        console.log(`Successfully set admin claim for user ${email} (uid: ${user.uid})`);
    } catch (error) {
        console.error('Error setting admin claim:', error);
        process.exit(1);
    }
}

main();
