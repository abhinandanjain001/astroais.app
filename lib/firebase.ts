import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase web configuration is public; authorization is enforced with ID tokens.
export function firebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp({
    apiKey: 'AIzaSyCnpoVFoqr37uj8--PJbGAdfmexrxtRGwE',
    authDomain: 'astroais.firebaseapp.com',
    projectId: 'astroais',
    storageBucket: 'astroais.firebasestorage.app',
    messagingSenderId: '494962784584',
    appId: '1:494962784584:web:4ac7ea5e420c373690db7d',
  });
  return getAuth(app);
}
