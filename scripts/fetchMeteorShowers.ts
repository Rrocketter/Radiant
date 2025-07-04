import { cert, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import serviceAccount from './path/to/your/firebase-service-account.json'; // 🔐 Download from Firebase Console

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com',
});

const db = getDatabase();

async function fetchAndStoreMeteorData() {
  // Example: static dataset (replace this with actual fetch if needed)
  const data = [
    {
      name: 'Perseids',
      peak: '2025-08-12',
      start: '2025-07-17',
      end: '2025-08-24',
      visibleIn: ['Northern Hemisphere'],
    },
    {
      name: 'Orionids',
      peak: '2025-10-21',
      start: '2025-10-02',
      end: '2025-11-07',
      visibleIn: ['Both'],
    }
  ];

  for (const shower of data) {
    await db.ref(`meteorShowers/${shower.peak}`).set(shower);
  }

  console.log('Meteor shower data uploaded!');
}

fetchAndStoreMeteorData();
