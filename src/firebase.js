import { initializeApp } from "firebase/app";
// Cambiamos enableIndexedDbPersistence por las nuevas funciones de caché persistente
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 1. Inicializamos la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializamos Firestore con el nuevo sistema de Caché Persistente
// Esto reemplaza a 'getFirestore' y 'enableIndexedDbPersistence' en una sola configuración
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

// Nota: Con esta configuración, el modo offline se activa automáticamente 
// de forma interna, por lo que ya no necesitas el bloque .catch() anterior.