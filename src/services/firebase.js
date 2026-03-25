import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Verifica si ya existe una instancia de la app para no duplicarla
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa Firestore con persistencia de datos local
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// --- Lógica de Submenú Salud ---

const saludRef = collection(db, "submenu_salud");

export const obtenerSalud = async () => {
  const snapshot = await getDocs(saludRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const añadirSubmenuSalud = async (nombre) => {
  return await addDoc(saludRef, { 
    nombre, 
    slug: nombre.toLowerCase().replace(/\s+/g, '-') 
  });
};

export const eliminarSubmenuSalud = async (id) => {
  const docRef = doc(db, "submenu_salud", id);
  await deleteDoc(docRef);
};