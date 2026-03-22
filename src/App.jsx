import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore'; 

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
  const [metricasData, setMetricasData] = useState([]);
  const [verMetricas, setVerMetricas] = useState(false);
  
  const [branding, setBranding] = useState({
    titulo: "PISIN",
    slogan: "FOOD & DELIVERY"
  });

  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());

  const obtenerBranding = async () => {
    try {
      const docRef = doc(db, "configuracion", "branding");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBranding(docSnap.data());
      } else {
        await setDoc(docRef, { titulo: "PISIN", slogan: "FOOD & DELIVERY" });
      }
    } catch (error) { console.error("Error branding:", error); }
  };

  const actualizarBranding = async (campo, valor) => {
    try {
      const docRef = doc(db, "configuracion", "branding");
      await updateDoc(docRef, { [campo]: valor });
      setBranding(prev => ({ ...prev, [campo]: valor }));
    } catch (error) { console.error("Error actualizando branding:", error); }
  };

  // --- NUEVA FUNCIÓN DE MÉTRICA DE VISITA ---
  const registrarVisitaGeneral = async () => {
    try {
      await addDoc(collection(db, "metricas"), {
        restauranteId: "VISITA_GENERAL",
        nombreRestaurante: "VISITAS TOTALES A LA APP 🌐",
        fecha: serverTimestamp(),
        tipoAccion: "page_view"
      });
    } catch (error) {
      console.error("Error al registrar visita:", error);
    }
  };

  const registrarClickMetrica = async (restaurante) => {
    try {
      await addDoc(collection(db, "metricas"), {
        restauranteId: restaurante.id,
        nombreRestaurante: restaurante.nombre,
        fecha: serverTimestamp(),
        tipoAccion: "whatsapp_click"
      });
    } catch (error) {
      console.error("Error al registrar métrica:", error);
    }
  };

  const obtenerMetricas = async () => {
    try {
      const q = query(collection(db, "metricas"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id, 
          fechaJS: data.fecha?.toDate() 
        };
      });
      
      const filtradosPorMes = docs.filter(d => 
        d.fechaJS && d.fechaJS.getMonth() === parseInt(mesFiltro) && 
        d.fechaJS.getFullYear() === new Date().getFullYear()
      );

      const conteo = filtradosPorMes.reduce((acc, curr) => {
        acc[curr.nombreRestaurante] = (acc[curr.nombreRestaurante] || 0) + 1;
        return acc;
      }, {});

      const listaOrdenada = Object.entries(conteo)
        .map(([nombre, clics]) => ({ nombre, clics }))
        .sort((a, b) => {
          // Forzar que la visita general siempre esté arriba
          if (a.nombre.includes("VISITAS TOTALES")) return -1;
          if (b.nombre.includes("VISITAS TOTALES")) return 1;
          return b.clics - a.clics;
        });

      setMetricasData(listaOrdenada);
    } catch (error) {
      console.error("Error al obtener métricas:", error);
    }
  };

  const eliminarMetricasRestaurante = async (nombreRestaurante) => {
    const confirmacion = window.confirm(`¿Seguro que quieres resetear los registros de "${nombreRestaurante}"?`);
    if (!confirmacion) return;

    try {
      const q = query(collection(db, "metricas"), where("nombreRestaurante", "==", nombreRestaurante));
      const querySnapshot = await getDocs(q);
      
      const promesasBorrado = querySnapshot.docs
        .filter(doc => {
          const fecha = doc.data().fecha?.toDate();
          return fecha && fecha.getMonth() === parseInt(mesFiltro) && fecha.getFullYear() === new Date().getFullYear();
        })
        .map(docRef => deleteDoc(doc(db, "metricas", docRef.id)));

      await Promise.all(promesasBorrado);
      alert("¡Registros limpiados! ✅");
      obtenerMetricas(); 
    } catch (error) {
      console.error("Error al eliminar métricas:", error);
    }
  };

  useEffect(() => {
    if (verMetricas) obtenerMetricas();
  }, [mesFiltro, verMetricas]);

  const enviarPedidoWhatsApp = (e, restaurante) => {
    e.stopPropagation(); 
    registrarClickMetrica(restaurante);

    const telefonoLimpio = restaurante.telefono.toString().replace(/\D/g, '');
    const nombreRestaurante = restaurante.nombre;
    const saludoCustom = restaurante.mensajePersonalizado && restaurante.mensajePersonalizado.trim() !== "" 
      ? restaurante.mensajePersonalizado 
      : `¡Hola! Quiero hacer un pedido en ${nombreRestaurante}.`;

    const texto = `PIZINGO PEDIDOS \n\n` +
                  `${saludoCustom}\n\n` +
                  `¿Me confirman disponibilidad? `;

    const enlace = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(texto)}`;
    window.open(enlace, '_blank');
  };

  const [tema, setTema] = useState(localStorage.getItem("tema_turbo") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem("tema_turbo", tema);
  }, [tema]);

  const toggleTema = () => {
    setTema(tema === "dark" ? "light" : "dark");
    sonidoPop.play().catch(() => {}); 
  };

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

  const editarCategoria = async (index, nombreViejo) => {
    const nombreNuevo = prompt("Editar nombre de la categoría:", nombreViejo);
    if (!nombreNuevo || nombreNuevo === nombreViejo || nombreNuevo === "Todos" || nombreNuevo === "Favoritos") return;

    try {
      const nuevaLista = [...categorias];
      nuevaLista[index] = nombreNuevo;
      await guardarCategorias(nuevaLista);

      const q = query(collection(db, "restaurante"), where("categoria", "==", nombreViejo));
      const querySnapshot = await getDocs(q);
      const promesas = querySnapshot.docs.map(restDoc => 
        updateDoc(doc(db, "restaurante", restDoc.id), { categoria: nombreNuevo })
      );
      await Promise.all(promesas);
      obtenerDatos();
      alert(`Categoría actualizada a "${nombreNuevo}" ✅`);
    } catch (error) {
      console.error("Error al editar categoría:", error);
    }
  };

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

      const params = new URLSearchParams(window.location.search);
      const compartidoId = params.get('id');
      if (compartidoId) {
        const encontrado = docs.find(r => r.id === compartidoId);
        if (encontrado) {
            setSeleccionado(encontrado);
            setActiveTab('info');
        }
      }

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
        tiktokUrl: "",
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
    obtenerBranding();
    // DISPARAR EL REGISTRO DE VISITA AL CARGAR LA APP
    registrarVisitaGeneral();
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

  if (cargando) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1 className="title">{branding.titulo}<span><span className="neon-duck">🦆</span></span></h1>
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

      <header className="app-header" style={{ paddingTop: '40px', paddingBottom: '20px', textAlign: 'center' }}>
        {esAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <input 
              className="title" 
              style={{ background: 'transparent', border: '1px dashed var(--accent)', color: 'white', textAlign: 'center', width: 'auto' }}
              defaultValue={branding.titulo}
              onBlur={(e) => actualizarBranding("titulo", e.target.value.toUpperCase())}
            />
            <input 
              className="slogan" 
              style={{ background: 'transparent', border: '1px dashed var(--accent)', color: 'var(--accent)', textAlign: 'center', fontSize: '0.8rem', width: '80%' }}
              defaultValue={branding.slogan}
              onBlur={(e) => actualizarBranding("slogan", e.target.value.toUpperCase())}
            />
          </div>
        ) : (
          <>
            <h1 className="title" onClick={() => window.location.href = window.location.origin + window.location.pathname} style={{cursor: 'pointer'}}>{branding.titulo}<span><span className="neon-duck">🦆</span></span></h1>
            <p className="slogan" style={{ letterSpacing: '5px', fontWeight: '700', color: 'var(--accent)', fontSize: '0.8rem' }}>
              {branding.slogan}
            </p>
          </>
        )}
      </header>
      
      {esAdmin && (
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px'}}>
            <button className="exit-admin-btn" onClick={() => { setEsAdmin(false); setVerMetricas(false); }}>Salir Admin 🔒</button>
            <button className="exit-admin-btn" onClick={() => { setVerMetricas(!verMetricas); if(!verMetricas) obtenerMetricas(); }} style={{background: 'var(--accent)', color: 'black'}}>
              {verMetricas ? "Ver Restaurantes ✏️" : "Dashboard de Ventas 📊"}
            </button>
        </div>
      )}

      {esAdmin && verMetricas ? (
        <div className="aparecer" style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
          <div style={{textAlign: 'center', marginBottom: '25px'}}>
            <h2 style={{color: 'var(--accent)', textShadow: '0 0 10px var(--accent)'}}>REYES DE PIZINGO 👑</h2>
            <p style={{marginBottom: '10px'}}>Filtrar por mes:</p>
            <select 
              value={mesFiltro} 
              onChange={(e) => setMesFiltro(e.target.value)}
              className="search-input"
              style={{ width: 'auto', minWidth: '200px', marginBottom: '10px', backgroundColor: '#1a1b22', color: 'white' }}
            >
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                <option key={i} value={i} style={{backgroundColor: '#1a1b22', color: 'white'}}>{mes}</option>
              ))}
            </select>
          </div>

          <div style={{overflowX: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid var(--accent)', padding: '10px'}}>
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
                    <td style={{padding: '15px', fontWeight: item.nombre.includes("VISITAS TOTALES") ? 'bold' : 'normal'}}>{item.nombre}</td>
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
        </div>
      ) : (
        <>
          <div className="category-container">
            {categorias.map((cat, index) => (
              <div key={cat} style={{position: 'relative', display: 'inline-block'}}>
                <button 
                  className={`category-btn ${filtroCategoria === cat ? 'active' : ''}`} 
                  onClick={() => setFiltroCategoria(cat)}
                  onDoubleClick={() => { if(esAdmin && cat !== "Todos" && cat !== "Favoritos") editarCategoria(index, cat) }}
                  title={esAdmin ? "Doble clic para editar" : ""}
                >
                  {cat === "Favoritos" ? `❤️ ${cat}` : cat}
                </button>
                {esAdmin && cat !== "Todos" && cat !== "Favoritos" && (
                  <span className="del-cat-badge" onClick={(e) => eliminarCategoria(e, cat)}>×</span>
                )}
              </div>
            ))}
            {esAdmin && <button className="category-btn add-cat-btn" onClick={añadirCategoria}>+ Nueva</button>}
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
                        <button className="admin-icon-btn del" onClick={(e) => eliminarRestaurante(e, res.id, res.nombre)}>🗑️ Restaurante</button>
                      </div>
                    ) : (
                      <button className={`fav-btn ${favoritos.includes(res.id) ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); favoritos.includes(res.id) ? setFavoritos(favoritos.filter(f => f !== res.id)) : setFavoritos([...favoritos, res.id]); }}>{favoritos.includes(res.id) ? '❤️' : '🤍'}</button>
                    )}
                  </div>

                  <div className="card-info">
                    {esAdmin ? (
                      <div className="admin-editor-grid" onClick={e => e.stopPropagation()}>
                        <input type="text" defaultValue={res.nombre} onBlur={e => actualizarDato(res.id, "nombre", e.target.value)} />
                        <select 
                          value={res.categoria} 
                          onChange={e => actualizarDato(res.id, "categoria", e.target.value)} 
                          style={{background: '#1a1b22', color: 'white', border: '1px solid #00f2ff', borderRadius: '5px'}}
                        >
                          {categorias.filter(c => c !== "Todos" && c !== "Favoritos").map(cat => (
                            <option key={cat} value={cat} style={{backgroundColor: '#1a1b22', color: 'white'}}>{cat}</option>
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
                          Abre: <input type="number" defaultValue={res.hAperturaRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, apertura: parseInt(e.target.value) })} />
                          Cierra: <input type="number" defaultValue={res.hCierreRaw} onBlur={e => actualizarDato(res.id, "horario", { ...res.horario, cierre: parseInt(e.target.value) })} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="status-badge"><span className={`dot ${estado.clase}`}></span> {estado.texto}</div>
                        <h3>{res.nombre}</h3>
                        <p style={{color: 'var(--accent)', fontWeight: 'bold'}}>🏠 Barrio: {res.barrio || 'Turbo'}</p>
                        <p onClick={(e) => { e.stopPropagation(); window.open(res.linkUbicacion || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.nombre + " Turbo")}`, '_blank'); }} style={{cursor: 'pointer'}}>📍 Ver Ubicación</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
                          <small>🕒 {res.aperturaTexto} - {res.cierreTexto}</small>
                          <button 
                            className="share-btn-inline" 
                            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '5px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const linkCompartir = `${window.location.origin}${window.location.pathname}?id=${res.id}`;
                              const textoWhatsApp = 
                                `¡Mira este sitio en Turbo! 🌴\n\n` +
                                `🍴 *${res.nombre}*\n` +
                                `📍 Zona: ${res.barrio || 'Turbo'}\n\n` +
                                `Revisa el menú aquí: `;
                              
                              if (navigator.share) {
                                navigator.share({ 
                                  title: res.nombre, 
                                  text: textoWhatsApp, 
                                  url: linkCompartir 
                                }).catch(console.error);
                              } else {
                                const fullMessage = `${textoWhatsApp} ${linkCompartir}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
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
            })}
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
                {seleccionado.menuUrl && (seleccionado.menuUrl.length > 0) && <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Menú</button>}
              </div>
              <div className="tab-content">
                {activeTab === 'info' ? (
                  <div className="aparecer">
                    <p>🏠 <strong>Barrio:</strong> {seleccionado.barrio || 'Turbo'}</p>
                    <p>🕒 <strong>Horario:</strong> {seleccionado.aperturaTexto} - {seleccionado.cierreTexto}</p>
                    <p>📞 <strong>Teléfono:</strong> {seleccionado.telefono}</p>
                    <div className="action-buttons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                      <button className="maps-btn" onClick={() => window.open(seleccionado.linkUbicacion || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seleccionado.nombre + " Turbo")}`, '_blank')}>🗺️ Maps</button>
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