import { useState, useEffect, useCallback } from 'react';
import { db } from "../services/firebase";
import { 
  collection, getDocs, doc, getDoc, addDoc, setDoc,
  serverTimestamp, query, orderBy, updateDoc, deleteDoc, where 
} from 'firebase/firestore';

const sonidoPop = new Audio('/pop.mp3'); 

export function useRestaurantes() {
  const [restaurantesFB, setRestaurantesFB] = useState([]);
  const [farmacias, setFarmacias] = useState([]); 
  const [submenusSalud, setSubmenusSalud] = useState([]); 
  const [cargando, setCargando] = useState(true);
  
  const [categorias, setCategorias] = useState([
    { nombre: "Todos", tipo: "sistema" },
    { nombre: "Favoritos", tipo: "sistema" }
  ]);
  
  const [branding, setBranding] = useState({ titulo: "PISINGO", slogan: "FOOD & DELIVERY" });
  const [metricasData, setMetricasData] = useState([]);
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());
  const [horaActual, setHoraActual] = useState(new Date()); 
  
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const guardados = localStorage.getItem("favoritos_turbo");
      return guardados ? JSON.parse(guardados) : [];
    } catch { return []; }
  });

  const [seleccionado, setSeleccionado] = useState(null);
  const [tema, setTema] = useState(localStorage.getItem("tema_turbo") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem("tema_turbo", tema);
  }, [tema]);

  useEffect(() => {
    localStorage.setItem("favoritos_turbo", JSON.stringify(favoritos));
  }, [favoritos]);

  const toggleTema = () => {
    setTema(prev => prev === "dark" ? "light" : "dark");
    sonidoPop.play().catch(() => {}); 
  };

  const obtenerBranding = async () => {
    try {
      const docRef = doc(db, "configuracion", "branding");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBranding(docSnap.data());
      } else {
        const defaultBranding = { titulo: "PISINGO", slogan: "FOOD & DELIVERY" };
        await setDoc(docRef, defaultBranding);
        setBranding(defaultBranding);
      }
    } catch (error) { console.error("Error branding:", error); }
  };

  const actualizarBranding = async (campo, valor) => {
    try {
      const docRef = doc(db, "configuracion", "branding");
      await updateDoc(docRef, { [campo]: valor });
      setBranding(prev => ({ ...prev, [campo]: valor }));
    } catch (error) { console.error("Error al actualizar branding:", error); }
  };

  const obtenerCategorias = async () => {
    try {
      const docRef = doc(db, "configuracion", "categorias");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().lista;
        if (!data.find(c => c.nombre === "Todos")) data.unshift({ nombre: "Todos", tipo: "sistema" });
        setCategorias(data);
      } else {
        const listaInicial = [
          { nombre: "Todos", tipo: "sistema" },
          { nombre: "COMIDAS RÁPIDAS", tipo: "restaurantes" },
          { nombre: "Favoritos", tipo: "sistema" }
        ];
        await setDoc(docRef, { lista: listaInicial });
        setCategorias(listaInicial);
      }
    } catch (error) { console.error("Error categorías:", error); }
  };

  const guardarCategorias = async (nuevaLista) => {
    try {
      const docRef = doc(db, "configuracion", "categorias");
      await setDoc(docRef, { lista: nuevaLista });
      setCategorias(nuevaLista);
    } catch (error) { console.error("Error al guardar categorías:", error); }
  };

  const añadirCategoria = async (nombreNuevo, tipoNuevo) => {
    const nombre = nombreNuevo || prompt("Nombre de la nueva categoría:");
    if (!nombre) return;
    const nombreUpper = nombre.toUpperCase();
    if (categorias.some(c => c.nombre === nombreUpper)) {
      alert("Esta categoría ya existe.");
      return;
    }
    const tipo = tipoNuevo || prompt("¿A qué sección pertenece? (gastronomia, consultorios, heladeria, belleza, deportes, perfumes, cocteles o estanquillos)")?.toLowerCase() || "restaurantes";
    const nuevaCategoriaObj = { nombre: nombreUpper, tipo: tipo };
    const nuevaLista = [...categorias];
    const indexFav = nuevaLista.findIndex(c => c.nombre === "Favoritos");
    if (indexFav !== -1) nuevaLista.splice(indexFav, 0, nuevaCategoriaObj);
    else nuevaLista.push(nuevaCategoriaObj);
    await guardarCategorias(nuevaLista);
  };

  const eliminarCategoria = async (e, catNombreAEliminar) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (catNombreAEliminar === "Todos" || catNombreAEliminar === "Favoritos") return;
    if (window.confirm(`¿Seguro que quieres eliminar la categoría "${catNombreAEliminar}"?`)) {
      const nuevaLista = categorias.filter(c => c.nombre !== catNombreAEliminar);
      await guardarCategorias(nuevaLista);
    }
  };

  const editarCategoria = async (index, nombreNuevoInput) => {
    const catVieja = categorias[index];
    if (["Todos", "Favoritos"].includes(catVieja.nombre)) return;
    const nombreNuevo = nombreNuevoInput?.toUpperCase();
    if (!nombreNuevo || nombreNuevo === catVieja.nombre) return;
    try {
      const nuevaLista = [...categorias];
      nuevaLista[index] = { ...nuevaLista[index], nombre: nombreNuevo };
      await guardarCategorias(nuevaLista);
      const q = query(collection(db, "restaurante"), where("categoria", "==", catVieja.nombre));
      const querySnapshot = await getDocs(q);
      const batchPromises = querySnapshot.docs.map(restDoc => 
        updateDoc(doc(db, "restaurante", restDoc.id), { categoria: nombreNuevo })
      );
      await Promise.all(batchPromises);
      obtenerDatos();
    } catch (error) { console.error("Error al editar categoría:", error); }
  };

  const registrarVisitaGeneral = async () => {
    if (sessionStorage.getItem("pisingo_visita_activa")) return;
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      await addDoc(collection(db, "metricas"), {
        restauranteId: "VISITA_GENERAL",
        nombreRestaurante: "VISITAS TOTALES A LA APP 🌐",
        fecha: serverTimestamp(),
        tipoAccion: "page_view",
        dispositivo: isMobile ? "Móvil" : "PC" 
      });
      sessionStorage.setItem("pisingo_visita_activa", "true");
    } catch (error) { console.error("Error al registrar visita:", error); }
  };

  const registrarClickMetrica = async (restaurante) => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      await addDoc(collection(db, "metricas"), {
        restauranteId: restaurante.id,
        nombreRestaurante: restaurante.nombre,
        fecha: serverTimestamp(),
        tipoAccion: "whatsapp_click",
        dispositivo: isMobile ? "Móvil" : "PC"
      });
    } catch (error) { console.error("Error métrica:", error); }
  };

  const obtenerMetricas = async (mesSeleccionado = mesFiltro) => {
    try {
      const q = query(collection(db, "metricas"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({ 
        ...d.data(), id: d.id, fechaJS: d.data().fecha?.toDate() 
      }));
      const filtrados = docs.filter(d => 
        d.fechaJS && d.fechaJS.getMonth() === parseInt(mesSeleccionado) && 
        d.fechaJS.getFullYear() === new Date().getFullYear()
      );
      const conteo = filtrados.reduce((acc, curr) => {
        acc[curr.nombreRestaurante] = (acc[curr.nombreRestaurante] || 0) + 1;
        return acc;
      }, {});
      const listaOrdenada = Object.entries(conteo)
        .map(([nombre, clics]) => ({ nombre, clics }))
        .sort((a, b) => {
          if (a.nombre.includes("VISITAS TOTALES")) return -1;
          if (b.nombre.includes("VISITAS TOTALES")) return 1;
          return b.clics - a.clics;
        });
      setMetricasData(listaOrdenada);
    } catch (error) { console.error("Error al obtener métricas:", error); }
  };

  const eliminarMetricasRestaurante = async (nombreRestaurante) => {
    if (!window.confirm(`¿Seguro que quieres resetear registros de "${nombreRestaurante}"?`)) return;
    try {
      const q = query(collection(db, "metricas"), where("nombreRestaurante", "==", nombreRestaurante));
      const querySnapshot = await getDocs(q);
      const anioActual = new Date().getFullYear();
      const promesasBorrado = querySnapshot.docs
        .filter(docSnap => {
          const fecha = docSnap.data().fecha?.toDate();
          return fecha && fecha.getMonth() === parseInt(mesFiltro) && fecha.getFullYear() === anioActual;
        })
        .map(docRef => deleteDoc(doc(db, "metricas", docRef.id)));
      await Promise.all(promesasBorrado);
      alert("¡Registros limpiados! ✅");
      obtenerMetricas(); 
    } catch (error) { console.error("Error al eliminar métricas:", error); }
  };

  const obtenerDatos = useCallback(async () => {
    setCargando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "restaurante"));
      
      const formatoAMPM = (h) => {
        if (h === 0 || h === 24) return "12:00 AM";
        if (h === 12) return "12:00 PM";
        return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
      };

      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const hApertura = Number(data.horario?.apertura ?? data.hAperturaRaw ?? 0);
        const hCierre = Number(data.horario?.cierre ?? data.hCierreRaw ?? 0);
        return { 
          ...data, 
          id: doc.id,
          aperturaTexto: formatoAMPM(hApertura),
          cierreTexto: formatoAMPM(hCierre),
          hAperturaRaw: hApertura,
          hCierreRaw: hCierre 
        };
      });

      const docsOrdenados = docs.sort((a, b) => {
        const fechaA = a.fechaCreacion?.seconds || 0;
        const fechaB = b.fechaCreacion?.seconds || 0;
        return fechaA - fechaB; 
      });

      setRestaurantesFB(docsOrdenados);

      const params = new URLSearchParams(window.location.search);
      const compartidoId = params.get('id');
      if (compartidoId) {
        const encontrado = docsOrdenados.find(r => r.id === compartidoId);
        if (encontrado) setSeleccionado(encontrado);
      }
    } catch (error) { console.error("Error cargando:", error); } 
    finally { setCargando(false); }
  }, []);

  const actualizarDato = async (id, campo, valor) => {
    try {
      const docRef = doc(db, "restaurante", id);
      await updateDoc(docRef, { [campo]: valor });
      setRestaurantesFB(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
    } catch (error) { console.error(error); }
  };

  const eliminarRestaurante = async (e, id, nombre) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm(`¿Seguro que quieres eliminar a ${nombre}?`)) return;
    try {
      await deleteDoc(doc(db, "restaurante", id));
      setRestaurantesFB(prev => prev.filter(r => r.id !== id));
    } catch (error) { console.error(error); }
  };

  const eliminarMenu = async (id) => {
  try {
    const restauranteRef = doc(db, "RESTAURANTES", id);
    await updateDoc(restauranteRef, {
      menuUrl: [] 
    });
    alert("Menú eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar menú:", error);
  }
};

  const eliminarImagenPerfil = async (id) => {
    if (!window.confirm("¿Deseas eliminar la foto de perfil?")) return;
    try {
      await actualizarDato(id, "imagenUrl", "");
      alert("Foto de perfil eliminada 🗑️");
    } catch (error) { console.error("Error al borrar foto:", error); }
  };

  const agregarRestaurante = async () => {
    const nombre = prompt("Nombre del nuevo sitio:");
    if (!nombre) return;
    try {
      const defaultCat = categorias.find(c => c.tipo === "restaurantes")?.nombre || "COMIDAS RÁPIDAS";
      const nuevo = {
        nombre: nombre.toUpperCase(),
        categoria: defaultCat,
        barrio: "", linkUbicacion: "", mensajePersonalizado: "", telefono: "57",
        imagenUrl: "", menuUrl: [], horario: { apertura: 8, cierre: 22 },
        fechaCreacion: serverTimestamp()
      };
      await addDoc(collection(db, "restaurante"), nuevo);
      obtenerDatos(); 
    } catch (error) { console.error(error); }
  };

  const enviarPedidoWhatsApp = (e, res) => {
    if (e && e.stopPropagation) e.stopPropagation();
    registrarClickMetrica(res);
    
    // Limpieza de teléfono y anteponer 57 si es necesario
    let telefonoLimpio = res.telefono.toString().replace(/\D/g, '');
    if (telefonoLimpio.length === 10) telefonoLimpio = "57" + telefonoLimpio;
    
    const saludoCustom = res.mensajePersonalizado?.trim() || `¡Hola! Quiero hacer un pedido en ${res.nombre}.`;
    const texto = `PISINGO PEDIDOS 🦆\n\n${saludoCustom}\n\n¿Me confirman disponibilidad?`;
    window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const listaFiltrada = restaurantesFB.filter(res => {
    const nombreRes = res.nombre?.toString().toLowerCase().trim() || "";
    const textoBusqueda = busqueda.toLowerCase().trim();
    const coincideNombre = nombreRes.includes(textoBusqueda);
    const catRestaurante = res.categoria?.toString().toUpperCase().trim() || "";
    const catFiltro = filtroCategoria.toUpperCase().trim();
    const coincideCategoria = 
      filtroCategoria === "Todos" || 
      (filtroCategoria === "Favoritos" 
        ? favoritos.includes(res.id) 
        : catRestaurante === catFiltro);
    return coincideNombre && coincideCategoria;
  });

  const obtenerEstadoEnVivo = (hAperturaRaw, hCierreRaw) => {
    const horaActualInt = new Date().getHours();
    const apertura = Number(hAperturaRaw);
    const cierre = Number(hCierreRaw);
    
    let estaAbierto = false;
    if (cierre > apertura) {
      estaAbierto = horaActualInt >= apertura && horaActualInt < cierre;
    } else {
      estaAbierto = horaActualInt >= apertura || horaActualInt < cierre;
    }

    return estaAbierto 
      ? { abierto: true, texto: "Abierto ahora", clase: "open" }
      : { abierto: false, texto: "Cerrado", clase: "closed" };
  };

  const subirImagenCloudinary = async (e, id, campo) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Restaurante_fotos');
    formData.append('cloud_name', 'dq5vhizl1');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dq5vhizl1/auto/upload`, {
        method: 'POST', body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        if (campo === "menuUrl") {
          const resActual = restaurantesFB.find(r => r.id === id);
          const menuActual = Array.isArray(resActual.menuUrl) ? resActual.menuUrl : (resActual.menuUrl ? [resActual.menuUrl] : []);
          const nuevoMenu = [...menuActual, data.secure_url];
          await actualizarDato(id, "menuUrl", nuevoMenu);
        } else {
          await actualizarDato(id, campo, data.secure_url);
        }
        alert("¡Archivo cargado correctamente! ✅");
      }
    } catch (error) { alert("Error al subir archivo."); }
  };

  const obtenerSubmenusSalud = async () => {
    try {
      const q = query(collection(db, "configuracion_salud"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      setSubmenusSalud(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const agregarSalud = async (nombre) => {
    try {
      await addDoc(collection(db, "configuracion_salud"), { nombre });
      obtenerSubmenusSalud();
    } catch (e) { console.error(e); }
  };

  const borrarSalud = async (id) => {
    if (!window.confirm("¿Borrar este submenú?")) return;
    try {
      await deleteDoc(doc(db, "configuracion_salud", id));
      obtenerSubmenusSalud();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([
        obtenerDatos(), 
        obtenerBranding(), 
        obtenerCategorias(),
        obtenerSubmenusSalud()
      ]);
      registrarVisitaGeneral();
    };
    inicializar();
    const timer = setInterval(() => setHoraActual(new Date()), 60000);
    return () => clearInterval(timer);
  }, [obtenerDatos]);

  return {
    restaurantesFB, listaFiltrada, cargando, categorias, branding,
    actualizarBranding, metricasData, busqueda, setBusqueda,
    filtroCategoria, setFiltroCategoria, favoritos, setFavoritos,
    mesFiltro, setMesFiltro, obtenerDatos, registrarClickMetrica,
    obtenerMetricas, eliminarMetricasRestaurante, subirImagenCloudinary,
    obtenerEstadoEnVivo, actualizarDato, eliminarRestaurante,
    agregarRestaurante, enviarPedidoWhatsApp, tema, toggleTema,
    añadirCategoria, eliminarCategoria, editarCategoria, seleccionado, setSeleccionado,
    eliminarMenu, eliminarImagenPerfil,
    submenusSalud, agregarSalud, borrarSalud 
  };
}