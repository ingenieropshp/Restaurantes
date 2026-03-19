import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// 1. Importar el registro
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Hemos eliminado las importaciones del serviceWorker que causaban el error 
// "serviceWorkerRegistration.register is not a function"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 2. Ejecutar el registro
serviceWorkerRegistration.register();

// Nota: En Vite, el modo offline se maneja con 'vite-plugin-pwa' 
// en lugar de la función .register() antigua.