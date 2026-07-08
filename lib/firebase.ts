import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'ambient-benefit-25xj8';
const databaseId = 'ai-studio-academicguide-4dcc4e98-b5a6-46bf-aa05-cbd8ec5b6b1e';

const app = getApps().length === 0 
  ? initializeApp({ projectId }) 
  : getApp();

export const db = getFirestore(app, databaseId);
