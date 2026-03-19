import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
// Añadimos deleteDoc para poder borrar registros de la base de datos
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'; 

const sonidoPop = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-pop-up-light-button-2629.mp3");

function App() {
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [restaurantesFB, setRestaurantesFB] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [horaActual, setHoraActual] = useState(new Date());
  const [activeTab, setActiveTab] = useState('info');
  
  const [esAdmin, setEsAdmin] = useState(false);

  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos_turbo");
    return guardados ? JSON.parse(guardados) : [];
  });

  const categorias = ["Todos", "Comida Rápida", "Almuerzos", "Postres", "Mariscos", "Favoritos"];

  // --- 1. FUNCIÓN PARA AGREGAR RESTAURANTE ---
  const agregarRestaurante = async () => {
    const nombre = prompt("Nombre del nuevo restaurante:");
    if (!nombre) return;

    try {
      await addDoc(collection(db, "restaurante"), {
        nombre: nombre,
        categoria: "Comida Rápida",
        zona: "Turbo",
        telefono: "57",
        imagenUrl: "",
        horario: { apertura: 8, cierre: 20 }
      });
      alert("¡Restaurante creado con éxito! 🚀");
      obtenerDatos();
    } catch (error) {
      console.error("Error al crear:", error);
      alert("Error al crear el documento.");
    }
  };

  // --- 2. FUNCIÓN PARA ELIMINAR RESTAURANTE ---
  const eliminarRestaurante = async (e, id, nombre) => {
    e.stopPropagation(); // Evita que se abra el modal al hacer clic en borrar
    const confirmar = window.confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción es permanente.`);
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, "restaurante", id));
        alert("Eliminado correctamente 🗑️");
        obtenerDatos();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar de la base de datos.");
      }
    }
  };

  const actualizarDato = async (id, campo, nuevoValor) => {
    try {
      const docRef = doc(db, "restaurante", id);
      await updateDoc(docRef, { [campo]: nuevoValor });
      obtenerDatos(); 
    } catch (error) {
      console.error("Error al actualizar campo:", error);
    }
  };

  const subirImagen = async (e, idRestaurante) => {
    e.stopPropagation(); 
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Restaurante_fotos'); 
    formData.append('cloud_name', 'dq5vhizl1'); 

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dq5vhizl1/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      const nuevaUrl = data.secure_url;

      const docRef = doc(db, "restaurante", idRestaurante); 
      await updateDoc(docRef, {
        imagenUrl: nuevaUrl
      });

      alert("¡Imagen actualizada con éxito! 📸");
      obtenerDatos(); 
    } catch (error) {
      console.error("Error al subir:", error);
      alert("Error: Verifica las reglas de Firebase o tu conexión.");
    }
  };

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

  const toggleFavorito = (e, id) => {
    e.stopPropagation(); 
    sonidoPop.currentTime = 0;
    sonidoPop.volume = 0.4;
    sonidoPop.play().catch(() => {});
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <h1 className="title">Restaurantes Turbo 🌴</h1>
        {esAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={agregarRestaurante}
              style={{ background: '#00f2ff', color: '#111', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
            >
              + Nuevo
            </button>
            <button 
              onClick={() => setEsAdmin(false)} 
              style={{ background: '#ff4b2b', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Salir Admin 🔒
            </button>
          </div>
        )}
      </div>

      <div className="category-container">
        {categorias.map(cat => (
          <button key={cat} className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`} onClick={() => setFiltroCategoria(cat)}>
            {cat === "Favoritos" ? `❤️ ${cat}` : cat}
          </button>
        ))}
      </div>

      <input 
        type="text" 
        className="search-input" 
        placeholder="¿Qué quieres comer hoy?..." 
        value={busqueda} 
        onChange={(e) => {
          const val = e.target.value;
          setBusqueda(val);
          if (val === "admin123") { 
            setEsAdmin(true);
            setBusqueda("");
            alert("¡Modo Administrador Activado! 🛠️");
          }
        }} 
      />

      <div className="restaurant-list">
        {listaFiltrada.map((res) => {
          const estado = obtenerEstadoEnVivo(res.hAperturaRaw, res.hCierreRaw);
          return (
            <div key={res.id} className="restaurant-card aparecer" onClick={() => { if(!esAdmin) { setSeleccionado(res); setActiveTab('info'); } }}>
              <div className="card-media">
                <img 
                  src={res.imagenUrl || res.imagen || 'https://placehold.co/400x200/2e303a/00f2ff?text=Esperando+Imagen...'} 
                  alt={res.nombre} 
                  className="card-header-img" 
                />
                <span className="category-tag">{res.categoria}</span>
                
                {esAdmin && (
                  <>
                    <div className="admin-upload" style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: '20' }}>
                      <label style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '50%', fontSize: '16px', display: 'flex', border: '1px solid #00f2ff' }}>
                        📷
                        <input 
                          type="file" 
                          onChange={(e) => subirImagen(e, res.id)} 
                          style={{ display: 'none' }} 
                          accept="image/*"
                        />
                      </label>
                    </div>
                    {/* BOTÓN DE ELIMINAR EXCLUSIVO PARA ADMIN */}
                    <button 
                      onClick={(e) => eliminarRestaurante(e, res.id, res.nombre)}
                      style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255, 75, 43, 0.9)', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', zIndex: '20', fontSize: '16px' }}
                    >
                      🗑️
                    </button>
                  </>
                )}

                <button className="share-btn-premium" onClick={(e) => compartirRestaurante(e, res)}>
                  ↗️
                </button>
                
                <button className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`} onClick={(e) => toggleFavorito(e, res.id)}>
                  {favoritos.includes(res.id) ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="card-info">
                {esAdmin ? (
                  <div className="admin-edit-fields" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                    <input 
                      style={{ background: '#1a1b22', color: 'white', border: '1px solid #333', padding: '5px', borderRadius: '4px' }}
                      type="text" 
                      defaultValue={res.nombre} 
                      onBlur={(e) => actualizarDato(res.id, "nombre", e.target.value)} 
                      placeholder="Nombre del sitio"
                    />
                    <input 
                      style={{ background: '#1a1b22', color: 'white', border: '1px solid #333', padding: '5px', borderRadius: '4px' }}
                      type="text" 
                      defaultValue={res.telefono} 
                      onBlur={(e) => actualizarDato(res.id, "telefono", e.target.value)} 
                      placeholder="Teléfono (Ej: 57300...)"
                    />
                    <input 
                      style={{ background: '#1a1b22', color: 'white', border: '1px solid #333', padding: '5px', borderRadius: '4px' }}
                      type="text" 
                      defaultValue={res.zona} 
                      onBlur={(e) => actualizarDato(res.id, "zona", e.target.value)} 
                      placeholder="Zona o Barrio"
                    />
                    <small style={{ color: '#00f2ff', fontSize: '10px' }}>* Cambios automáticos al salir del campo</small>
                  </div>
                ) : (
                  <>
                    <div className="status-badge">
                      <span className={`dot ${estado.clase}`}></span>
                      <span className="status-text">{estado.texto}</span>
                    </div>
                    <h3>{res.nombre}</h3>
                    <p className="hour-range">📍 {res.zona || 'Turbo, Antioquia'}</p>
                    <small className="hour-range">🕒 {res.aperturaTexto} - {res.cierreTexto}</small>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSeleccionado(null)}>×</button>
            <img 
              src={seleccionado.imagenUrl || seleccionado.imagen || 'https://placehold.co/400x200/2e303a/00f2ff?text=Restaurante'} 
              alt={seleccionado.nombre} 
              className="modal-img" 
            />
            
            <div className="modal-body">
              <h2 style={{margin: '10px 0'}}>{seleccionado.nombre}</h2>
              <p className="modal-description">{seleccionado.descripcion || "¡El mejor sabor de Turbo te espera! 🌴"}</p>

              <div className="tabs-container">
                <div className="tabs-header">
                  <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>ℹ️ Info</button>
                  <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>📑 Menú</button>
                </div>

                <div className="tab-content">
                  {activeTab === 'info' && (
                    <div className="tab-pane aparecer">
                      <p>📍 <strong>Ubicación:</strong> {seleccionado.zona || 'Turbo, Antioquia'}</p>
                      <p>🕒 <strong>Horario:</strong> {seleccionado.aperturaTexto} - {seleccionado.cierreTexto}</p>
                      <p>🍴 <strong>Categoría:</strong> {seleccionado.categoria}</p>
                    </div>
                  )}
                  {activeTab === 'menu' && (
                    <div className="tab-pane aparecer">
                      {seleccionado.menuUrl ? (
                        <img src={seleccionado.menuUrl} alt="Menú" className="menu-preview-img" />
                      ) : (
                        <div className="no-menu">
                          <p>Menú digital no disponible.</p>
                          <small>¡Consulta por WhatsApp!</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button className="order-btn" onClick={() => {
                const numeroLimpio = seleccionado.telefono.toString().replace(/\D/g, '');
                window.open(`https://wa.me/${numeroLimpio}?text=Hola! Vi tu restaurante en Turbo y quiero hacer un pedido.`, '_blank');
              }}>
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