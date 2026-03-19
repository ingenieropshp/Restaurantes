import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
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

  // --- FUNCIONES DE BASE DE DATOS ---
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
    } catch (error) { console.error("Error al obtener datos:", error); } finally { setCargando(false); }
  };

  const agregarRestaurante = async () => {
    const nombre = prompt("Nombre del nuevo restaurante:");
    if (!nombre) return;
    try {
      const nuevoRestaurante = {
        nombre: nombre,
        categoria: "Comida Rápida",
        zona: "Turbo, Antioquia",
        telefono: "57",
        imagenUrl: "",
        menuUrl: "",
        facebookUrl: "",
        instagramUrl: "",
        horario: { apertura: 8, cierre: 20 }
      };
      await addDoc(collection(db, "restaurante"), nuevoRestaurante);
      alert("¡Restaurante creado con éxito! 🚀");
      obtenerDatos();
    } catch (error) { alert("Error al crear: " + error.message); }
  };

  const eliminarRestaurante = async (e, id, nombre) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar "${nombre}"?`)) {
      try {
        await deleteDoc(doc(db, "restaurante", id));
        obtenerDatos();
      } catch (error) { alert("Error al eliminar."); }
    }
  };

  const actualizarDato = async (id, campo, nuevoValor) => {
    try {
      const docRef = doc(db, "restaurante", id);
      await updateDoc(docRef, { [campo]: nuevoValor });
      obtenerDatos(); 
    } catch (error) { console.error("Error al actualizar:", error); }
  };

  const subirImagenCloudinary = async (e, idRestaurante, campo) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Restaurante_fotos'); 
    formData.append('cloud_name', 'dq5vhizl1'); 

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dq5vhizl1/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        await actualizarDato(idRestaurante, campo, data.secure_url);
        alert("¡Imagen cargada correctamente! 📸");
      }
    } catch (error) { alert("Error al subir imagen."); }
  };

  useEffect(() => { obtenerDatos(); }, []);
  useEffect(() => {
    localStorage.setItem("favoritos_turbo", JSON.stringify(favoritos));
  }, [favoritos]);

  const obtenerEstadoEnVivo = (apertura, cierre) => {
    const ahora = horaActual.getHours() + (horaActual.getMinutes() / 60);
    if (apertura === 0 && cierre === 0) return { clase: "closed", texto: "Cerrado" };
    let abierto = (cierre < apertura) ? (ahora >= apertura || ahora < cierre) : (ahora >= apertura && ahora < cierre);
    return abierto ? { clase: "open", texto: "Abierto ahora" } : { clase: "closed", texto: "Cerrado" };
  };

  const listaFiltrada = restaurantesFB.filter(res => {
    const coincideNombre = res.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "Todos" || (filtroCategoria === "Favoritos" ? favoritos.includes(res.id) : res.categoria === filtroCategoria);
    return coincideNombre && coincideCategoria;
  });

  return (
    <div className="app-container">
      <h1 className="title">Restaurantes Turbo 🌴</h1>
      
      {esAdmin && (
        <button className="exit-admin-btn" onClick={() => setEsAdmin(false)}>Salir Admin 🔒</button>
      )}

      <div className="category-container">
        {categorias.map(cat => (
          <button key={cat} className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`} onClick={() => setFiltroCategoria(cat)}>
            {cat === "Favoritos" ? `❤️ ${cat}` : cat}
          </button>
        ))}
      </div>

      <input 
        type="text" className="search-input" placeholder="¿Qué quieres comer hoy?..." 
        value={busqueda} 
        onChange={(e) => {
          setBusqueda(e.target.value);
          if (e.target.value === "admin123") { setEsAdmin(true); setBusqueda(""); alert("Modo Admin Activo 🛠️"); }
        }} 
      />

      <div className="restaurant-list">
        {listaFiltrada.map((res) => {
          const estado = obtenerEstadoEnVivo(res.hAperturaRaw, res.hCierreRaw);
          return (
            <div key={res.id} className="restaurant-card aparecer" onClick={() => { if(!esAdmin) { setSeleccionado(res); setActiveTab('info'); } }}>
              <div className="card-media">
                <img src={res.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} className="card-header-img" alt={res.nombre} />
                {esAdmin ? (
                  <div className="admin-actions-overlay">
                    <label className="admin-icon-btn"> 📷 Principal
                      <input type="file" onChange={(e) => subirImagenCloudinary(e, res.id, "imagenUrl")} style={{ display: 'none' }} />
                    </label>
                    <label className="admin-icon-btn"> 📑 Menú
                      <input type="file" onChange={(e) => subirImagenCloudinary(e, res.id, "menuUrl")} style={{ display: 'none' }} />
                    </label>
                    <button className="admin-icon-btn del" onClick={(e) => eliminarRestaurante(e, res.id, res.nombre)}>🗑️</button>
                  </div>
                ) : (
                  <>
                    <button className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); favoritos.includes(res.id) ? setFavoritos(favoritos.filter(f => f !== res.id)) : setFavoritos([...favoritos, res.id]); }}>
                      {favoritos.includes(res.id) ? '❤️' : '🤍'}
                    </button>
                    <button className="share-btn" onClick={(e) => { 
                      e.stopPropagation(); 
                      const textoACompartir = `¡Mira este restaurante en Turbo! 🌴\n\n*${res.nombre}*\n📍 Zona: ${res.zona || 'Turbo'}\n🍴 Categoría: ${res.categoria}`;
                      const urlApp = window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: res.nombre, text: textoACompartir, url: urlApp }).catch(() => console.log("Error")); 
                      } else {
                        window.open(`https://wa.me/?text=${encodeURIComponent(textoACompartir + "\n" + urlApp)}`, '_blank');
                      }
                    }}>🔗</button>
                  </>
                )}
              </div>

              <div className="card-info">
                {esAdmin ? (
                  <div className="admin-editor-grid" onClick={e => e.stopPropagation()}>
                    <input type="text" defaultValue={res.nombre} onBlur={e => actualizarDato(res.id, "nombre", e.target.value)} placeholder="Nombre" />
                    <input type="text" defaultValue={res.facebookUrl} onBlur={e => actualizarDato(res.id, "facebookUrl", e.target.value)} placeholder="Link Facebook" />
                    <input type="text" defaultValue={res.instagramUrl} onBlur={e => actualizarDato(res.id, "instagramUrl", e.target.value)} placeholder="Link Instagram" />
                    <input type="text" defaultValue={res.telefono} onBlur={e => actualizarDato(res.id, "telefono", e.target.value)} placeholder="Tel (57...)" />
                    <div className="admin-hours">
                      Abre: <input type="number" defaultValue={res.hAperturaRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, apertura: parseInt(e.target.value) })} />
                      Cierra: <input type="number" defaultValue={res.hCierreRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, cierre: parseInt(e.target.value) })} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="status-badge"><span className={`dot ${estado.clase}`}></span> {estado.texto}</div>
                    <h3>{res.nombre}</h3>
                    <p onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.nombre + " " + (res.zona || 'Turbo, Antioquia'))}`, '_blank'); }} style={{cursor: 'pointer'}}>
                      📍 {res.zona || 'Turbo, Antioquia'}
                    </p>
                    <small>🕒 {res.aperturaTexto} - {res.cierreTexto}</small>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {esAdmin && <button className="fab-button" onClick={agregarRestaurante}>+</button>}

      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSeleccionado(null)}>×</button>
            <img src={seleccionado.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} className="modal-img" alt={seleccionado.nombre} />
            <div className="modal-body">
              <h2>{seleccionado.nombre}</h2>
              <div className="tabs-header">
                <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Info</button>
                {seleccionado.menuUrl && (
                    <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Menú</button>
                )}
              </div>
              <div className="tab-content">
                {activeTab === 'info' ? (
                  <div className="aparecer">
                    <p>📍 <strong>Zona:</strong> {seleccionado.zona}</p>
                    <p>🕒 <strong>Horario:</strong> {seleccionado.aperturaTexto} - {seleccionado.cierreTexto}</p>
                    <p>📞 <strong>Teléfono:</strong> {seleccionado.telefono}</p>
                    
                    <div className="action-buttons-grid">
                      <button className="maps-btn" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seleccionado.nombre + " " + seleccionado.zona)}`, '_blank')}>
                        🗺️ Maps
                      </button>
                      {seleccionado.instagramUrl && (
                        <button className="ig-btn" onClick={() => window.open(seleccionado.instagramUrl, '_blank')}>
                          📸 Instagram
                        </button>
                      )}
                      {seleccionado.facebookUrl && (
                        <button className="fb-btn" onClick={() => window.open(seleccionado.facebookUrl, '_blank')}>
                          🔵 Facebook
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* CONTENIDO DE LA PESTAÑA DE MENÚ ACTUALIZADO */
                  activeTab === 'menu' && seleccionado.menuUrl && (
                    <div className="aparecer">
                      <p style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '10px' }}>
                        ✨ Toca la imagen para ampliarla
                      </p>
                      <a href={seleccionado.menuUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={seleccionado.menuUrl} 
                          className="menu-preview-img" 
                          alt="Ver menú completo"
                          style={{ cursor: 'zoom-in' }} 
                        />
                      </a>
                    </div>
                  )
                )}
              </div>
              <button className="order-btn" onClick={() => window.open(`https://wa.me/${seleccionado.telefono.toString().replace(/\D/g, '')}`, '_blank')}>
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