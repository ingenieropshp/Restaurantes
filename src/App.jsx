import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore'; 

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
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // --- LÓGICA DE WHATSAPP ---
  const enviarPedidoWhatsApp = (e, restaurante) => {
    e.stopPropagation(); 
    const telefonoLimpio = restaurante.telefono.toString().replace(/\D/g, '');
    const nombreRestaurante = restaurante.nombre;
    const saludoCustom = restaurante.mensajePersonalizado && restaurante.mensajePersonalizado.trim() !== "" 
      ? restaurante.mensajePersonalizado 
      : `¡Hola! Quiero hacer un pedido en ${nombreRestaurante}.`;

    const texto = `PIZINGO PEDIDOS \n` +
                  `--------------------------\n` +
                  `${saludoCustom}\n\n` +
                  `--------------------------\n` +
                  `¿Me confirman disponibilidad? `;

    const enlace = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(texto)}`;
    window.open(enlace, '_blank');
  };

  // --- LÓGICA DE TEMA ---
  const [tema, setTema] = useState(localStorage.getItem("tema_turbo") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem("tema_turbo", tema);
  }, [tema]);

  const toggleTema = () => {
    setTema(tema === "dark" ? "light" : "dark");
    sonidoPop.play().catch(() => {}); 
  };

  // --- CATEGORÍAS ---
  const [categorias, setCategorias] = useState(["Todos", "Favoritos"]);
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos_turbo");
    return guardados ? JSON.parse(guardados) : [];
  });

  const obtenerCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "configuracion"));
      const docCats = querySnapshot.docs.find(d => d.id === "categorias");
      if (docCats) {
        setCategorias(docCats.data().lista);
      } else {
        const listaInicial = ["Todos", "Comida Rápida", "Almuerzos", "Postres", "Mariscos", "Favoritos"];
        await setDoc(doc(db, "configuracion", "categorias"), { lista: listaInicial });
        setCategorias(listaInicial);
      }
    } catch (error) { console.error("Error categorías:", error); }
  };

  const guardarCategorias = async (nuevaLista) => {
    try {
      await updateDoc(doc(db, "configuracion", "categorias"), { lista: nuevaLista });
      setCategorias(nuevaLista);
    } catch (error) { alert("Error al guardar categorías"); }
  };

  const añadirCategoria = async () => {
    const nueva = prompt("Nombre de la nueva categoría:");
    if (!nueva || categorias.includes(nueva)) return;
    const nuevaLista = [...categorias];
    const indexFav = nuevaLista.indexOf("Favoritos");
    if (indexFav !== -1) nuevaLista.splice(indexFav, 0, nueva);
    else nuevaLista.push(nueva);
    await guardarCategorias(nuevaLista);
  };

  const eliminarCategoria = async (e, catAEliminar) => {
    e.stopPropagation();
    if (catAEliminar === "Todos" || catAEliminar === "Favoritos") return;
    if (window.confirm(`¿Seguro que quieres eliminar la categoría "${catAEliminar}"?`)) {
      const nuevaLista = categorias.filter(c => c !== catAEliminar);
      await guardarCategorias(nuevaLista);
    }
  };

  // --- DATOS FIREBASE ---
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
        categoria: categorias[1] || "General", 
        barrio: "", 
        linkUbicacion: "", 
        mensajePersonalizado: "", 
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

  // --- NUEVA FUNCIÓN CON LÓGICA DE ARRAY PARA MENÚ ---
  const subirImagenCloudinary = async (e, idRestaurante, campo) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Restaurante_fotos');
    formData.append('cloud_name', 'dq5vhizl1');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dq5vhizl1/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.secure_url) {
        if (campo === "menuUrl") {
          const resActual = restaurantesFB.find(r => r.id === idRestaurante);
          const menuActual = Array.isArray(resActual.menuUrl) ? resActual.menuUrl : (resActual.menuUrl ? [resActual.menuUrl] : []);
          const nuevoMenu = [...menuActual, data.secure_url];
          await actualizarDato(idRestaurante, "menuUrl", nuevoMenu);
        } else {
          await actualizarDato(idRestaurante, campo, data.secure_url);
        }
        alert("¡Archivo cargado y añadido al menú! ✅");
      }
    } catch (error) {
      alert("Error al subir archivo.");
    }
  };

  useEffect(() => { 
    obtenerDatos(); 
    obtenerCategorias(); 
    const timer = setInterval(() => setHoraActual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // --- CAMBIO: RENDER CONDICIONAL PARA CARGA ---
  if (cargando) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1 className="title">
            PIZINGO<span><span className="neon-duck">🦆</span></span>
          </h1>
          <div className="spinner"></div>
          <p className="loading-text">Cocinando la experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <button className="theme-toggle-btn" onClick={toggleTema} title="Cambiar modo">
        {tema === "dark" ? "🌙" : "☀️"}
      </button>

      <header className="app-header" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
        <h1 className="title">
          PIZINGO<span><span className="neon-duck">🦆</span></span>
        </h1>
        
        <p className="slogan" style={{ 
          fontFamily: 'var(--font-principal)',
          letterSpacing: '5px',
          fontWeight: '700',
          color: 'var(--accent)',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          FOOD & DELIVERY
        </p>
      </header>
      
      {esAdmin && (
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px'}}>
           <button className="exit-admin-btn" onClick={() => setEsAdmin(false)}>Salir Admin 🔒</button>
        </div>
      )}

      <div className="category-container">
        {categorias.map(cat => (
          <div key={cat} style={{position: 'relative', display: 'inline-block'}}>
            <button 
              className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`} 
              onClick={() => setFiltroCategoria(cat)}
            >
              {cat === "Favoritos" ? `❤️ ${cat}` : cat}
            </button>
            {esAdmin && cat !== "Todos" && cat !== "Favoritos" && (
              <span className="del-cat-badge" onClick={(e) => eliminarCategoria(e, cat)}>×</span>
            )}
          </div>
        ))}
        {esAdmin && (
          <button className="category-btn add-cat-btn" onClick={añadirCategoria}>+ Nueva</button>
        )}
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
            <div 
              key={res.id} 
              className="restaurant-card aparecer" 
              onClick={() => { if(!esAdmin) { setSeleccionado(res); setActiveTab('info'); } }}
            >
              <div className="card-media">
                <img 
                  src={res.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} 
                  className="card-header-img" 
                  alt={res.nombre} 
                  style={{ objectFit: 'contain', backgroundColor: '#fff' }}
                />
                
                {esAdmin ? (
                  <div className="admin-actions-overlay">
                    <label className="admin-icon-btn"> 📷 Principal
                      <input type="file" onChange={(e) => subirImagenCloudinary(e, res.id, "imagenUrl")} style={{ display: 'none' }} />
                    </label>

                    <div className="admin-menu-group">
                      <label className="admin-icon-btn menu"> 📑 {res.menuUrl ? "Añadir al Menú" : "Subir Menú"}
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={(e) => subirImagenCloudinary(e, res.id, "menuUrl")} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      
                      {res.menuUrl && (
                        <button 
                          className="admin-icon-btn del-menu" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm("¿Eliminar todos los archivos del menú?")) {
                              actualizarDato(res.id, "menuUrl", ""); 
                              alert("Menú eliminado 🗑️");
                            }
                          }}
                        > ❌ </button>
                      )}
                    </div>

                    <button className="admin-icon-btn del" onClick={(e) => eliminarRestaurante(e, res.id, res.nombre)}>🗑️ Restaurante</button>
                  </div>
                ) : (
                  <>
                    <button className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); favoritos.includes(res.id) ? setFavoritos(favoritos.filter(f => f !== res.id)) : setFavoritos([...favoritos, res.id]); }}>
                      {favoritos.includes(res.id) ? '❤️' : '🤍'}
                    </button>
                    <button className="share-btn" onClick={(e) => { 
                      e.stopPropagation(); 
                      const textoACompartir = `¡Mira este restaurante en Turbo! 🌴\n\n*${res.nombre}*\n📍 Barrio: ${res.barrio || 'Turbo'}\n🍴 Categoría: ${res.categoria}`;
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
                    
                    <select 
                      value={res.categoria} 
                      onChange={e => actualizarDato(res.id, "categoria", e.target.value)}
                      style={{background: '#1a1b22', color: 'white', border: '1px solid #00f2ff', borderRadius: '5px', padding: '5px'}}
                    >
                      {categorias.filter(c => c !== "Todos" && c !== "Favoritos").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <input type="text" defaultValue={res.barrio} onBlur={e => actualizarDato(res.id, "barrio", e.target.value)} placeholder="Barrio" />
                    <input type="text" defaultValue={res.linkUbicacion} onBlur={e => actualizarDato(res.id, "linkUbicacion", e.target.value)} placeholder="Link Google Maps" />
                    
                    <input type="text" defaultValue={res.facebookUrl} onBlur={e => actualizarDato(res.id, "facebookUrl", e.target.value)} placeholder="Link Facebook" />
                    <input type="text" defaultValue={res.instagramUrl} onBlur={e => actualizarDato(res.id, "instagramUrl", e.target.value)} placeholder="Link Instagram" />
                    <input type="text" defaultValue={res.telefono} onBlur={e => actualizarDato(res.id, "telefono", e.target.value)} placeholder="Tel (57...)" />
                    
                    <textarea 
                      placeholder="Mensaje personalizado de WhatsApp..."
                      defaultValue={res.mensajePersonalizado} 
                      onBlur={e => actualizarDato(res.id, "mensajePersonalizado", e.target.value)}
                      style={{gridColumn: '1 / -1', background: '#1a1b22', color: 'white', border: '1px solid #00f2ff', borderRadius: '5px', padding: '5px', minHeight: '50px'}}
                    />

                    <div className="admin-hours">
                      Abre: <input type="number" defaultValue={res.hAperturaRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, apertura: parseInt(e.target.value) })} />
                      Cierra: <input type="number" defaultValue={res.hCierreRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, cierre: parseInt(e.target.value) })} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="status-badge"><span className={`dot ${estado.clase}`}></span> {estado.texto}</div>
                    <h3>{res.nombre}</h3>
                    <p style={{color: 'var(--accent)', fontWeight: 'bold', marginBottom: '4px'}}>🏠 Barrio: {res.barrio || 'Turbo'}</p>
                    <p onClick={(e) => { 
                        e.stopPropagation(); 
                        if(res.linkUbicacion) window.open(res.linkUbicacion, '_blank');
                        else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.nombre + " Turbo")}`, '_blank');
                    }} style={{cursor: 'pointer'}}>
                      📍 Ver Ubicación
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
            <img 
              src={seleccionado.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} 
              className="modal-img" 
              alt={seleccionado.nombre} 
              style={{ objectFit: 'contain', backgroundColor: '#fff' }}
            />
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
                    <p>🏠 <strong>Barrio:</strong> {seleccionado.barrio || 'Turbo'}</p>
                    <p>🕒 <strong>Horario:</strong> {seleccionado.aperturaTexto} - {seleccionado.cierreTexto}</p>
                    <p>📞 <strong>Teléfono:</strong> {seleccionado.telefono}</p>
                    <div className="action-buttons-grid">
                      <button className="maps-btn" onClick={() => {
                        if(seleccionado.linkUbicacion) window.open(seleccionado.linkUbicacion, '_blank');
                        else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seleccionado.nombre + " Turbo")}`, '_blank');
                      }}>🗺️ Maps</button>
                      {seleccionado.instagramUrl && <button className="ig-btn" onClick={() => window.open(seleccionado.instagramUrl, '_blank')}>📸 Instagram</button>}
                      {seleccionado.facebookUrl && <button className="fb-btn" onClick={() => window.open(seleccionado.facebookUrl, '_blank')}>🔵 Facebook</button>}
                    </div>
                  </div>
                ) : (
                  activeTab === 'menu' && seleccionado.menuUrl && (
                    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(Array.isArray(seleccionado.menuUrl) ? seleccionado.menuUrl : [seleccionado.menuUrl]).map((url, index) => (
                        <div key={index}>
                          {url.toLowerCase().includes('.pdf') ? (
                             <div className="pdf-viewer-container" style={{ padding: '20px', background: 'rgba(0,242,255,0.05)', borderRadius: '15px', border: '1px dashed var(--accent)' }}>
                               <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>
                                 📄 ABRIR PDF PARTE {index + 1} ↗️
                               </a>
                             </div>
                          ) : (
                            <img 
                              src={url} 
                              className="menu-preview-img" 
                              alt={`Menú ${index + 1}`} 
                              onClick={() => setImagenAmpliada(url)} 
                              style={{ width: '100%', borderRadius: '10px', cursor: 'zoom-in' }} 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
              <button 
                className="order-btn" 
                onClick={(e) => enviarPedidoWhatsApp(e, seleccionado)}
              >
                Pedir Por WhatsApp 📱
              </button>
            </div>
          </div>
        </div>
      )}

      {imagenAmpliada && (
        <div className="lightbox-overlay" onClick={() => setImagenAmpliada(null)}>
          <button className="close-lightbox" onClick={() => setImagenAmpliada(null)}>×</button>
          <img src={imagenAmpliada} className="lightbox-img" alt="Ampliado" />
        </div>
      )}
    </div>
  );
}

export default App;