import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore';

function App() {
  const [busqueda, setBusqueda] = useState("");
  const [tarjetasVisibles, setTarjetasVisibles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [restaurantesFB, setRestaurantesFB] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  
  // --- 1. ESTADO PARA FAVORITOS ---
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos_turbo");
    return guardados ? JSON.parse(guardados) : [];
  });

  const categorias = ["Todos", "Comida Rápida", "Almuerzos", "Postres", "Mariscos", "Favoritos"];

  // --- 2. CARGA DE DATOS DESDE FIREBASE ---
  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "restaurante")); 
        const docs = querySnapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          // Leemos directamente los campos que creaste en Firebase
          apertura: doc.data().apertura || 0, 
          cierre: doc.data().cierre || 0 
        }));
        setRestaurantesFB(docs);
      } catch (error) {
        console.error("Error al traer datos:", error);
      } finally {
        setTimeout(() => setCargando(false), 800);
      }
    };
    obtenerDatos();
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos_turbo", JSON.stringify(favoritos));
  }, [favoritos]);

  // --- 3. LÓGICA DE FILTRADO ---
  const listaFiltrada = restaurantesFB.filter(res => {
    const coincideNombre = res.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = 
      filtroCategoria === "Todos" || 
      (filtroCategoria === "Favoritos" ? favoritos.includes(res.id) : res.categoria === filtroCategoria);
    return coincideNombre && coincideCategoria;
  });

  // --- 4. FUNCIÓN "SORPRÉNDEME" ---
  const elegirAlAzar = () => {
    if (listaFiltrada.length === 0) return;
    const indiceAzar = Math.floor(Math.random() * listaFiltrada.length);
    setSeleccionado(listaFiltrada[indiceAzar]);
  };

  const toggleFavorito = (e, id) => {
    e.stopPropagation(); 
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // --- 5. FUNCIÓN DE ESTADO (USA TUS CAMPOS DE FIREBASE) ---
  const obtenerEstadoVenta = (apertura, cierre) => {
    const horaActual = new Date().getHours();
    
    // Si no hay horarios definidos, mostramos cerrado por seguridad
    if (apertura === 0 && cierre === 0) return "closed";

    // Lógica para horarios que cruzan la medianoche (ej: abre 18:00, cierra 02:00)
    if (cierre < apertura) {
      return (horaActual >= apertura || horaActual < cierre) ? "open" : "closed";
    }
    
    // Horario normal
    return (horaActual >= apertura && horaActual < cierre) ? "open" : "closed";
  };

  useEffect(() => {
    if (!cargando) {
      setTarjetasVisibles({}); 
      listaFiltrada.forEach((res, index) => {
        setTimeout(() => {
          setTarjetasVisibles(prev => ({ ...prev, [res.id]: true }));
        }, index * 100);
      });
    }
  }, [busqueda, cargando, filtroCategoria, restaurantesFB.length]);

  return (
    <div className="app-container">
      <h1 className="title">Restaurantes Turbo 🌴</h1>

      <div className="category-container">
        {categorias.map(cat => (
          <button 
            key={cat}
            className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(cat)}
          >
            {cat === "Favoritos" ? `❤️ ${cat}` : cat}
          </button>
        ))}
      </div>

      <div className="search-box">
        <input 
          type="text" 
          className="search-input"
          placeholder="¿Qué quieres comer hoy?..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} 
        />
      </div>

      {cargando ? (
        <div className="loader-container">
          <div className="neon-spinner"></div>
          <p className="loading-text">Buscando sabores...</p>
        </div>
      ) : (
        <div className="restaurant-list">
          {listaFiltrada.length > 0 ? (
            listaFiltrada.map((res) => {
              const estado = obtenerEstadoVenta(res.apertura, res.cierre);
              return (
                <div 
                  key={res.id} 
                  className={`restaurant-card ${tarjetasVisibles[res.id] ? 'aparecer' : ''}`}
                  onClick={() => setSeleccionado(res)}
                >
                  <button 
                    className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorito(e, res.id)}
                  >
                    {favoritos.includes(res.id) ? '❤️' : '🤍'}
                  </button>

                  <h2 className="restaurant-name">{res.nombre}</h2>
                  
                  {/* BADGE DE ESTADO DINÁMICO */}
                  <div className="status-badge">
                    <span className={`dot ${estado}`}></span>
                    <span className="status-text">
                      {estado === "open" ? "Abierto ahora" : "Cerrado"}
                    </span>
                    <small className="hour-range">({res.apertura}:00 - {res.cierre}:00)</small>
                  </div>

                  <p className="restaurant-info">📍 {res.zona || 'Turbo'}</p>
                  {res.categoria && <span className="badge-cat">{res.categoria}</span>}
                </div>
              );
            })
          ) : (
            <p className="no-results">No hay resultados... 😕</p>
          )}
        </div>
      )}

      {/* MODAL */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSeleccionado(null)}>×</button>
            <img 
              src={seleccionado.img || seleccionado.imagen || 'https://via.placeholder.com/400x250?text=Turbo+Restaurante'} 
              alt={seleccionado.nombre} 
              className="modal-img" 
            />
            <h2>{seleccionado.nombre}</h2>
            <p className="modal-tipo">{seleccionado.categoria || 'Gastronomía Local'}</p>
            <hr className="modal-divider" />
            <p className="modal-desc">
              {seleccionado.descripcion || "Disfruta de la mejor gastronomía en el corazón de Turbo. ¡Calidad y sabor garantizados! 🌴"}
            </p>
            <button 
              className="order-btn"
              onClick={() => {
                const mensaje = `¡Hola! Me gustaría hacer un pedido en *${seleccionado.nombre}*`;
                const url = `https://wa.me/${seleccionado.telefono}?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');
              }}
            >
              Pedir por WhatsApp 📱
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;