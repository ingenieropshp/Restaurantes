import { useState, useEffect } from 'react'; 
import './App.css';
import { useRestaurantes } from './hooks/useRestaurantes';
import Navbar from "./components/Navbar.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

function App() {
  const { 
    restaurantesFB, 
    listaFiltrada, 
    cargando, 
    branding, 
    metricasData, 
    busqueda, 
    setBusqueda, 
    setFiltroCategoria,
    filtroCategoria, // Añadido para la lógica de favoritos
    obtenerMetricas,
    actualizarBranding,
    mesFiltro, 
    setMesFiltro,
    eliminarMetricasRestaurante,
    categorias,
    editarCategoria,
    eliminarCategoria,
    añadirCategoria,
    obtenerEstadoEnVivo,
    subirImagenCloudinary,
    actualizarDato,
    eliminarRestaurante,
    agregarRestaurante,
    enviarPedidoWhatsApp,
    tema,      
    toggleTema, 
    favoritos, 
    setFavoritos,
    seleccionado: seleccionadoURL 
  } = useRestaurantes();

  const [seleccionado, setSeleccionado] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [verMetricas, setVerMetricas] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [imagenAmpliada, setImagenAmpliada] = useState(null); 
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");

  useEffect(() => {
    if (seleccionadoURL) {
      setSeleccionado(seleccionadoURL);
      setActiveTab('info');
    }
  }, [seleccionadoURL]);

  const totalMovil = metricasData.filter(m => m.dispositivo === "Móvil").length;
  const totalPC = metricasData.filter(m => m.dispositivo === "PC").length;

  if (cargando) return <LoadingScreen titulo={branding?.titulo || "Cargando..."} />;

  return (
    <div className={`app-container ${tema}`}>
      
      <Navbar 
        branding={branding} 
        categorias={categorias}
        restaurantesFB={restaurantesFB}
        setFiltroCategoria={setFiltroCategoria}
        esAdmin={esAdmin}
        verMetricas={verMetricas}
        setVerMetricas={setVerMetricas}
        obtenerMetricas={obtenerMetricas}
        tema={tema}
        toggleTema={toggleTema}
        favoritos={favoritos} // Pasamos los favoritos al Navbar
      />

      {esAdmin && (
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', marginTop: '70px'}}>
            <button className="exit-admin-btn" onClick={() => { setEsAdmin(false); setVerMetricas(false); }}>Salir Admin 🔒</button>
            <button 
              className="exit-admin-btn" 
              onClick={() => { 
                const nuevoEstado = !verMetricas;
                setVerMetricas(nuevoEstado); 
                if(nuevoEstado) obtenerMetricas(); 
              }} 
              style={{background: 'var(--accent)', color: 'black'}}
            >
              {verMetricas ? "Ver Restaurantes ✏️" : "Dashboard de Ventas 📊"}
            </button>
        </div>
      )}
      
      <header className="app-header" style={{ paddingTop: esAdmin ? '10px' : '80px', paddingBottom: '20px', textAlign: 'center' }}>
        {esAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <input 
              className="title" 
              style={{ background: 'transparent', border: '1px dashed var(--accent)', color: 'white', textAlign: 'center', width: 'auto' }}
              defaultValue={branding?.titulo}
              onBlur={e => actualizarBranding("titulo", e.target.value)}
            />
            <input 
              className="slogan" 
              style={{ background: 'transparent', border: '1px dashed var(--accent)', color: 'var(--accent)', textAlign: 'center', fontSize: '0.8rem', width: '80%' }}
              defaultValue={branding?.slogan}
              onBlur={(e) => actualizarBranding("slogan", e.target.value.toUpperCase())}
            />
          </div>
        ) : (
          <>
            <h1 className="title" onClick={() => window.location.reload()} style={{cursor: 'pointer'}}>
              {branding?.titulo}<span><span className="neon-duck"> 🦆</span></span>
            </h1>
            <p className="slogan" style={{ letterSpacing: '5px', fontWeight: '700', color: 'var(--accent)', fontSize: '0.8rem' }}>
              {branding?.slogan}
            </p>
          </>
        )}
      </header>

      {esAdmin && verMetricas ? (
        <div className="aparecer" style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
          <div style={{textAlign: 'center', marginBottom: '25px'}}>
            <h2 style={{color: 'var(--accent)', textShadow: '0 0 10px var(--accent)'}}>REYES DE PISINGO 👑</h2>
            
            <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0'}}>
                <div style={{background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', border: '1px solid #00f2ff'}}>
                    <small style={{display: 'block', opacity: 0.7}}>TRÁFICO MÓVIL</small>
                    <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>📱 {totalMovil}</span>
                </div>
                <div style={{background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', border: '1px solid #00f2ff'}}>
                    <small style={{display: 'block', opacity: 0.7}}>TRÁFICO PC</small>
                    <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>💻 {totalPC}</span>
                </div>
            </div>

            <p style={{marginBottom: '10px'}}>Filtrar por mes:</p>
            <select 
              value={mesFiltro} 
              onChange={(e) => {
                setMesFiltro(e.target.value);
                obtenerMetricas(e.target.value);
              }}
              className="search-input"
              style={{ width: 'auto', minWidth: '200px', marginBottom: '10px', backgroundColor: '#1a1b22', color: 'white' }}
            >
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                <option key={i} value={i} style={{backgroundColor: '#1a1b22', color: 'white'}}>{mes}</option>
              ))}
            </select>
          </div>

          <div style={{overflowX: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid var(--accent)', padding: '10px', marginBottom: '40px'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', color: 'white'}}>
              <thead>
                <tr style={{borderBottom: '2px solid var(--accent)', textAlign: 'left'}}>
                  <th style={{padding: '15px'}}>Puesto</th>
                  <th style={{padding: '15px'}}>Nombre / Métrica</th>
                  <th style={{padding: '15px', textAlign: 'center'}}>Clicks / Visitas</th>
                  <th style={{padding: '15px', textAlign: 'center'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {metricasData.length > 0 ? metricasData.map((item, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(0,242,255,0.1)',
                    backgroundColor: item.nombre.includes("VISITAS TOTALES") ? 'rgba(0, 242, 255, 0.05)' : 'transparent'
                  }}>
                    <td style={{padding: '15px', fontWeight: 'bold'}}>{item.nombre.includes("VISITAS TOTALES") ? "⭐" : (i === 0 || (metricasData[0].nombre.includes("VISITAS TOTALES") && i === 1) ? "🥇" : `#${i + 1}`)}</td>
                    <td style={{padding: '15px', fontWeight: item.nombre.includes("VISITAS TOTALES") ? 'bold' : 'normal'}}>
                        {item.nombre}
                    </td>
                    <td style={{padding: '15px', textAlign: 'center', color: 'var(--accent)', fontWeight: 'bold'}}>{item.clics}</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <button onClick={() => eliminarMetricasRestaurante(item.nombre)} style={{ background: '#ff4b2b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>RESETEAR 🗑️</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{padding: '30px', textAlign: 'center', opacity: 0.6}}>No hay datos registrados en este mes.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid var(--accent)', padding: '20px'}}>
            <h2 style={{color: 'var(--accent)', marginBottom: '20px', fontSize: '1.2rem'}}>⚙️ GESTIONAR CATEGORÍAS</h2>
            
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Nombre de nueva categoría..." 
                value={nuevaCatNombre}
                onChange={(e) => setNuevaCatNombre(e.target.value)}
                style={{marginBottom: 0, flex: 1}}
              />
              <button 
                className="exit-admin-btn" 
                style={{background: 'var(--accent)', color: 'black', margin: 0, width: 'auto', padding: '0 20px'}}
                onClick={() => {
                  if(nuevaCatNombre.trim()){
                    añadirCategoria(nuevaCatNombre.trim());
                    setNuevaCatNombre("");
                  }
                }}
              >
                Añadir +
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px'}}>
              {categorias.filter(c => c.nombre !== "Todos" && c.nombre !== "Favoritos").map((cat) => (
                <div key={cat.id || cat.nombre} style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
                  <input 
                    type="text" 
                    defaultValue={cat.nombre} 
                    onBlur={(e) => {
                      if(e.target.value !== cat.nombre) editarCategoria(cat.id, e.target.value);
                    }}
                    style={{background: 'transparent', border: 'none', color: 'white', flex: 1, fontSize: '0.9rem'}}
                  />
                  <button 
                    onClick={() => {
                      if(window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) {
                        eliminarCategoria(cat.id, cat.nombre);
                      }
                    }}
                    style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem'}}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <input 
            type="text" className="search-input" placeholder="¿Qué quieres comer hoy?..." 
            value={busqueda} 
            onChange={(e) => {
              setBusqueda(e.target.value);
              if (e.target.value === "admin123") { setEsAdmin(true); setBusqueda(""); alert("Modo Admin Activo 🛠️"); }
            }} 
          />

          <div className="restaurant-list">
            {/* LÓGICA DE ESTADOS VACÍOS (BÚSQUEDA Y FAVORITOS) */}
            {listaFiltrada.length === 0 && !cargando ? (
              filtroCategoria === "Favoritos" ? (
                /* CASO: FAVORITOS VACÍOS */
                <div className="vacio-container aparecer" style={{ gridColumn: '1 / -1' }}>
                  <div className="vacio-icon">💔</div>
                  <h3 className="vacio-titulo">Lista vacía</h3>
                  <p className="vacio-texto">Parece que aún no has guardado tus lugares preferidos.</p>
                  <button className="btn-explorar" onClick={() => setFiltroCategoria("Todos")}>Descubrir sitios</button>
                </div>
              ) : (
                /* CASO: BÚSQUEDA SIN RESULTADOS */
                <div className="aparecer" style={{ 
                  textAlign: 'center', 
                  gridColumn: '1 / -1', 
                  padding: '60px 20px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: '20px',
                  border: '1px dashed var(--accent)',
                  marginTop: '20px'
                }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🦆</div>
                  <h3 style={{ color: 'white', marginBottom: '10px' }}>¡Uy! El Pisingo no encontró nada</h3>
                  <p style={{ color: 'var(--accent)', opacity: 0.8, fontSize: '0.9rem', marginBottom: '25px' }}>
                    No hay resultados para "{busqueda}". Prueba con otra palabra o categoría.
                  </p>
                  <button 
                    className="btn-explorar"
                    onClick={() => { setBusqueda(""); setFiltroCategoria("Todos"); }}
                  >
                    Volver al inicio 🔄
                  </button>
                </div>
              )
            ) : (
              listaFiltrada.map((res) => {
                const estado = typeof obtenerEstadoEnVivo === 'function' 
                  ? obtenerEstadoEnVivo(res.hAperturaRaw, res.hCierreRaw) 
                  : { texto: "Cargando...", clase: "" };

                return (
                  <div key={res.id} className="restaurant-card aparecer" onClick={() => { if(!esAdmin) { setSeleccionado(res); setActiveTab('info'); } }}>
                    <div className="card-media">
                      <img src={res.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} className="card-header-img" alt={res.nombre} style={{ objectFit: 'contain', backgroundColor: '#fff' }} />
                      {esAdmin ? (
                        <div className="admin-actions-overlay">
                          <label className="admin-icon-btn"> 📷 Principal
                            <input type="file" onChange={(e) => subirImagenCloudinary(e, res.id, "imagenUrl")} style={{ display: 'none' }} />
                          </label>
                          <div className="admin-menu-group">
                            <label className="admin-icon-btn menu"> 📑 {res.menuUrl ? "Añadir al Menú" : "Subir Menú"}
                              <input type="file" accept="image/*,application/pdf" onChange={(e) => subirImagenCloudinary(e, res.id, "menuUrl")} style={{ display: 'none' }} />
                            </label>
                            {res.menuUrl && <button className="admin-icon-btn del-menu" onClick={(e) => { e.stopPropagation(); if(window.confirm("¿Eliminar menú?")) actualizarDato(res.id, "menuUrl", ""); }}> ❌ </button>}
                          </div>
                          <button className="admin-icon-btn del" onClick={(e) => { e.stopPropagation(); eliminarRestaurante(e, res.id, res.nombre); }}>🗑️ ELIMINAR</button>
                        </div>
                      ) : (
                        <button className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); favoritos.includes(res.id) ? setFavoritos(favoritos.filter(f => f !== res.id)) : setFavoritos([...favoritos, res.id]); }}>{favoritos.includes(res.id) ? '❤️' : '🤍'}</button>
                      )}
                    </div>

                    <div className="card-info" style={{padding: '15px'}}>
                      {esAdmin ? (
                        <div className="admin-editor-grid" onClick={e => e.stopPropagation()}>
                          <input type="text" defaultValue={res.nombre} onBlur={e => actualizarDato(res.id, "nombre", e.target.value)} />
                          
                          <select 
                            value={res.categoria} 
                            onChange={e => actualizarDato(res.id, "categoria", e.target.value)} 
                            style={{background: '#1a1b22', color: 'white', border: '1px solid #00f2ff', borderRadius: '5px'}}
                          >
                            <option value="">Seleccionar Categoría</option> 
                            {categorias.filter(c => c.nombre !== "Todos" && c.nombre !== "Favoritos").map((cat, idx) => (
                              <option key={idx} value={cat.nombre}>{cat.nombre}</option>
                            ))}
                          </select>
                          
                          <input type="text" defaultValue={res.barrio} onBlur={e => actualizarDato(res.id, "barrio", e.target.value)} placeholder="Barrio" />
                          <input type="text" defaultValue={res.linkUbicacion} onBlur={e => actualizarDato(res.id, "linkUbicacion", e.target.value)} placeholder="Link Maps" />
                          <input type="text" defaultValue={res.telefono} onBlur={e => actualizarDato(res.id, "telefono", e.target.value)} placeholder="Tel (57...)" />
                          <input type="text" defaultValue={res.instagramUrl} onBlur={e => actualizarDato(res.id, "instagramUrl", e.target.value)} placeholder="Enlace Instagram" />
                          <input type="text" defaultValue={res.facebookUrl} onBlur={e => actualizarDato(res.id, "facebookUrl", e.target.value)} placeholder="Enlace Facebook" />
                          <input type="text" defaultValue={res.tiktokUrl} onBlur={e => actualizarDato(res.id, "tiktokUrl", e.target.value)} placeholder="Enlace TikTok" />
                          
                          <textarea defaultValue={res.mensajePersonalizado} onBlur={e => actualizarDato(res.id, "mensajePersonalizado", e.target.value)} style={{gridColumn: '1 / -1', background: '#1a1b22', color: 'white'}} />
                          <div className="admin-hours">
                            Abre: <input 
                              type="number" 
                              defaultValue={res.hAperturaRaw} 
                              onBlur={e => {
                                const val = parseInt(e.target.value);
                                actualizarDato(res.id, "horario", { ...res.horario, apertura: val });
                                actualizarDato(res.id, "hAperturaRaw", val); // Doble guardado para consistencia
                              }} 
                            />
                            Cierra: <input 
                              type="number" 
                              defaultValue={res.hCierreRaw} 
                              onBlur={e => {
                                const val = parseInt(e.target.value);
                                actualizarDato(res.id, "horario", { ...res.horario, cierre: val });
                                actualizarDato(res.id, "hCierreRaw", val); // Doble guardado para consistencia
                              }} 
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="status-badge"><span className={`dot ${estado.clase}`}></span> {estado.texto}</div>
                          <h3 style={{margin: '10px 0', color: 'white'}}>{res.nombre}</h3>
                          <p style={{color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem'}}>🏠 Barrio: {res.barrio || 'Turbo'}</p>
                          <p onClick={(e) => { e.stopPropagation(); window.open(res.linkUbicacion || `http://google.com/maps?q=${encodeURIComponent(res.nombre + " Turbo")}`, '_blank'); }} style={{cursor: 'pointer', fontSize: '0.8rem', opacity: 0.8}}>📍 Ver Ubicación</p>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                            <small style={{color: '#aaa'}}>🕒 {res.aperturaTexto} - {res.cierreTexto}</small>
                            <button 
                              className="share-btn-inline" 
                              style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '5px', padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const linkCompartir = `${window.location.origin}${window.location.pathname}?id=${res.id}`;
                                const textoWhatsApp = `¡Mira este sitio en Turbo! 🍴 *${res.nombre}* 📍 Zona: ${res.barrio || 'Turbo'}`;
                                if (navigator.share) {
                                  navigator.share({ title: res.nombre, text: textoWhatsApp, url: linkCompartir }).catch(console.error);
                                } else {
                                  window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsApp + " " + linkCompartir)}`, '_blank');
                                }
                              }}
                            >
                              COMPARTIR 🔗
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {esAdmin && !verMetricas && <button className="fab-button" onClick={agregarRestaurante}>+</button>}

      {seleccionado && (
        <div className="modal-overlay" onClick={() => { setSeleccionado(null); window.history.replaceState({}, '', window.location.pathname); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setSeleccionado(null); window.history.replaceState({}, '', window.location.pathname); }}>×</button>
            <img src={seleccionado.imagenUrl || 'https://placehold.co/400x200/2e303a/00f2ff?text=Nuevo+Sitio'} className="modal-img" alt={seleccionado.nombre} />
            <div className="modal-body">
              <h2>{seleccionado.nombre}</h2>
              <div className="tabs-header">
                <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Info</button>
                {seleccionado.menuUrl && (Array.isArray(seleccionado.menuUrl) ? seleccionado.menuUrl.length > 0 : seleccionado.menuUrl.length > 0) && (
                  <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Menú</button>
                )}
              </div>
              <div className="tab-content">
                {activeTab === 'info' ? (
                  <div className="aparecer">
                    <p>🏠 <strong>Barrio:</strong> {seleccionado.barrio || 'Turbo'}</p>
                    <p>🕒 <strong>Horario:</strong> {seleccionado.aperturaTexto} - {seleccionado.cierreTexto}</p>
                    <p>📞 <strong>Teléfono:</strong> {seleccionado.telefono}</p>
                    <div className="action-buttons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                      <button className="maps-btn" onClick={() => window.open(seleccionado.linkUbicacion || `http://google.com/maps?q=${encodeURIComponent(seleccionado.nombre + " Turbo")}`, '_blank')}>🗺️ Maps</button>
                      {seleccionado.instagramUrl && <button className="ig-btn" onClick={() => window.open(seleccionado.instagramUrl, '_blank')} style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', border: 'none' }}>📸 Instagram</button>}
                      {seleccionado.facebookUrl && <button className="fb-btn" onClick={() => window.open(seleccionado.facebookUrl, '_blank')} style={{ background: '#1877F2', color: 'white', border: 'none' }}>🔵 Facebook</button>}
                      {seleccionado.tiktokUrl && <button className="tiktok-btn" onClick={() => window.open(seleccionado.tiktokUrl, '_blank')} style={{ background: '#000000', color: '#ffffff', border: 'none', position: 'relative', boxShadow: '-2px 0 0 #00f2ff, 2px 0 0 #ff0050', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>🎵 TikTok</button>}
                    </div>
                  </div>
                ) : (
                  <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(Array.isArray(seleccionado.menuUrl) ? seleccionado.menuUrl : [seleccionado.menuUrl]).map((url, i) => (
                      <div key={i}>
                        {url.toLowerCase().includes('.pdf') ? (
                          <a href={url} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline', fontWeight: 'bold', display: 'block', padding: '10px', textAlign: 'center'}}>📄 ABRIR MENU PDF {i + 1}</a>
                        ) : (
                          <img src={url} className="menu-preview-img" onClick={() => setImagenAmpliada(url)} style={{ width: '100%', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} alt={`Menú ${i+1}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="order-btn" onClick={(e) => enviarPedidoWhatsApp(e, seleccionado)}>Pedir Por WhatsApp 📱</button>
            </div>
          </div>  
        </div>
      )}

      {imagenAmpliada && (
        <div className="lightbox-overlay" onClick={() => setImagenAmpliada(null)}>
          <button className="close-lightbox" onClick={() => setImagenAmpliada(null)}>×</button>
          <img src={imagenAmpliada} className="lightbox-img" alt="Menu ampliado" />
        </div>
      )}
    </div>
  );
}

export default App;