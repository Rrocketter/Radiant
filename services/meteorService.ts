import { child, get, ref } from 'firebase/database';
import { db } from './firebase';

export async function getMeteorShowers() {
  const snapshot = await get(child(ref(db), 'meteorShowers'));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.values(data); // return as array
  } else {
    return [];
  }
}
