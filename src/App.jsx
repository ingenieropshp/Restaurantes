import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore';

// Definimos el sonido fuera del componente para optimizar
const sonidoPop = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-pop-up-light-button-2629.mp3");

function App() {
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [restaurantesFB, setRestaurantesFB] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [horaActual, setHoraActual] = useState(new Date());

  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos_turbo");
    return guardados ? JSON.parse(guardados) : [];
  });

  const categorias = ["Todos", "Comida Rápida", "Almuerzos", "Postres", "Mariscos", "Favoritos"];

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos_turbo", JSON.stringify(favoritos));
  }, [favoritos]);

  const obtenerDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "restaurante")); 
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const hApertura = data.horario?.apertura ?? 0;
        const hCierre = data.horario?.cierre ?? 0;

        const formatoAMPM = (h) => {
          if (h === 0) return "12:00 AM";
          if (h === 12) return "12:00 PM";
          return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
        };

        return { 
          ...data, 
          id: doc.id,
          aperturaTexto: formatoAMPM(hApertura),
          cierreTexto: formatoAMPM(hCierre),
          hAperturaRaw: hApertura,
          hCierreRaw: hCierre
        };
      });
      setRestaurantesFB(docs);
    } catch (error) { 
      console.error("Error al obtener datos:", error); 
    } finally { 
      setTimeout(() => setCargando(false), 800); 
    }
  };

  useEffect(() => { obtenerDatos(); }, []);

  const obtenerEstadoEnVivo = (apertura, cierre) => {
    const ahora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    const tiempoActual = ahora + minutos / 60;

    if (apertura === 0 && cierre === 0) return { clase: "closed", texto: "Cerrado" };
    
    let abierto = false;
    if (cierre < apertura) {
      abierto = tiempoActual >= apertura || tiempoActual < cierre;
    } else {
      abierto = tiempoActual >= apertura && tiempoActual < cierre;
    }

    if (!abierto) return { clase: "closed", texto: "Cerrado" };

    const tiempoParaCerrar = cierre > ahora ? cierre - tiempoActual : (24 - tiempoActual) + cierre;
    if (tiempoParaCerrar <= 0.5) return { clase: "warning", texto: "Cierra pronto ⏳" };
    
    return { clase: "open", texto: "Abierto ahora" };
  };

  const compartirRestaurante = (e, res) => {
    e.stopPropagation();
    const mensaje = `*¡Mira este sitio en Turbo!* 🌴\n\n🍴 *${res.nombre}*\n📍 Zona: ${res.zona || 'Turbo'}\n\nRevisa el menú aquí: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // --- FUNCIÓN CON EFECTO DE SONIDO ---
  const toggleFavorito = (e, id) => {
    e.stopPropagation(); 
    
    // Reproducir sonido pop
    sonidoPop.currentTime = 0; // Reinicia para clics rápidos
    sonidoPop.volume = 0.4;    // Volumen moderado
    sonidoPop.play().catch(err => console.log("Audio bloqueado por navegador"));

    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const listaFiltrada = restaurantesFB.filter(res => {
    const coincideNombre = res.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "Todos" || (filtroCategoria === "Favoritos" ? favoritos.includes(res.id) : res.categoria === filtroCategoria);
    return coincideNombre && coincideCategoria;
  });

  return (
    <div className="app-container">
      <h1 className="title">Restaurantes Turbo 🌴</h1>

      <div className="category-container">
        {categorias.map(cat => (
          <button key={cat} className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`} onClick={() => setFiltroCategoria(cat)}>
            {cat === "Favoritos" ? `❤️ ${cat}` : cat}
          </button>
        ))}
      </div>

      <input type="text" className="search-input" placeholder="¿Qué quieres comer hoy?..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      <div className="restaurant-list">
        {listaFiltrada.map((res) => {
          const estado = obtenerEstadoEnVivo(res.hAperturaRaw, res.hCierreRaw);
          return (
            <div key={res.id} className="restaurant-card aparecer" onClick={() => setSeleccionado(res)}>
              
              <button 
                className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorito(e, res.id)}
              >
                {favoritos.includes(res.id) ? '❤️' : '🤍'}
              </button>

              <button className="share-btn" onClick={(e) => compartirRestaurante(e, res)}>↗️</button>

              <h2 className="restaurant-name">{res.nombre}</h2>
              
              <div className="status-badge">
                <span className={`dot ${estado.clase}`}></span>
                <span className={`status-text ${estado.clase}`}>{estado.texto}</span>
                <small className="hour-range">({res.aperturaTexto} - {res.cierreTexto})</small>
              </div>

              <p className="restaurant-info">📍 {res.zona || 'Turbo'}</p>
              <span className="badge-cat">{res.categoria}</span>
            </div>
          );
        })}
      </div>

      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSeleccionado(null)}>×</button>
            <img src={seleccionado.imagen} alt={seleccionado.nombre} className="modal-img" />
            <div style={{padding: '20px'}}>
              <h2>{seleccionado.nombre}</h2>
              <p>{seleccionado.descripcion || "¡El mejor sabor de Turbo te espera! 🌴"}</p>
              <button className="order-btn" onClick={() => window.open(`https://wa.me/${seleccionado.telefono}`, '_blank')}>
                Pedir por WhatsApp 📱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;