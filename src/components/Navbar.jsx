import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ 
  branding, 
  categorias = [], 
  restaurantesFB = [], 
  submenusSalud = [], 
  setFiltroCategoria, 
  esAdmin, 
  verMetricas, 
  setVerMetricas,
  obtenerMetricas,
  tema,
  toggleTema,
  favoritos = [] 
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Estados para controlar qué acordeón está abierto
  const [acordeonAbierto, setAcordeonAbierto] = useState(null);

  const toggleAcordeon = (seccion) => {
    setAcordeonAbierto(acordeonAbierto === seccion ? null : seccion);
  };

  const manejarFiltro = (catNombre) => {
    const nombreFinal = typeof catNombre === 'object' ? catNombre.nombre : catNombre;
    setFiltroCategoria(nombreFinal);
    if (setVerMetricas) setVerMetricas(false); 
    setMenuAbierto(false);
    // Hacer scroll suave hacia arriba al filtrar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSubmenu = (tipoMenu) => {
    if (!categorias || !Array.isArray(categorias)) return null;

    const filtradas = categorias
      .filter(cat => cat && cat.tipo === tipoMenu && cat.nombre)
      .map(cat => {
        const totalSitios = restaurantesFB.filter(res => 
          res.categoria?.toString().trim().toUpperCase() === cat.nombre?.toString().trim().toUpperCase()
        ).length;
        
        return { ...cat, totalSitios };
      });

    if (filtradas.length === 0 && (tipoMenu !== "salud" || submenusSalud.length === 0)) {
      return (
        <ul className="submenu-categorias" style={{ listStyle: 'none', paddingLeft: '15px' }}>
          <li style={{ fontSize: '0.75rem', opacity: 0.5, padding: '12px 0' }}>PRÓXIMAMENTE...</li>
        </ul>
      );
    }

    return (
      <ul className="submenu-categorias aparecer" style={{ 
        listStyle: 'none', paddingLeft: '15px', background: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto', borderLeft: '2px solid var(--accent)' 
      }}>
        
        {filtradas.map((cat, index) => (
          <li key={index} onClick={() => manejarFiltro(cat.nombre)} 
              className="submenu-item"
              style={{ fontSize: '0.85rem', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '10px' }}>
            <span>{String(cat.nombre).toUpperCase()}</span>
            <span style={{ opacity: 0.5, fontSize: '0.7rem', background: 'rgba(0,242,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              {cat.totalSitios}
            </span>
          </li>
        ))}

        {tipoMenu === "salud" && submenusSalud.map((item) => (
          <li key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Link 
              to={`/salud/${item.slug || item.id}`} 
              onClick={() => setMenuAbierto(false)}
              style={{ color: 'white', textDecoration: 'none', fontSize: '0.85rem', display: 'block', padding: '12px 0' }}
            >
              {item.nombre ? item.nombre.toUpperCase() : 'SIN NOMBRE'}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <nav className={`hamburguesa-nav ${menuAbierto ? 'abierto' : ''}`}>
        <div className="hamburguesa-content">
          <header style={{ marginBottom: '20px' }}>
            <h2 style={{ color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {branding?.titulo} <span style={{ fontSize: '1.5rem' }}>🦆</span>
            </h2>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, fontStyle: 'italic' }}>
              {branding?.slogan}
            </p>
          </header>
          
          <hr style={{ borderColor: 'rgba(0,242,255,0.1)', margin: '15px 0' }} />
          
          {/* CONTENEDOR CON SCROLL PARA SECCIONES */}
          <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '5px' }}>
            <ul className="hamburguesa-links" style={{ listStyle: 'none', padding: 0 }}>
              {/* INICIO */}
              <li onClick={() => manejarFiltro("Todos")} 
                  style={{ cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏠 INICIO
              </li>

              {/* FAVORITOS */}
              <li 
                onClick={() => manejarFiltro("Favoritos")} 
                className={favoritos.length > 0 ? 'pulse-favoritos' : ''}
                style={{ 
                  cursor: 'pointer', 
                  marginBottom: '15px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px',
                  borderRadius: '8px',
                  background: favoritos.length > 0 ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                  border: favoritos.length > 0 ? '1px solid rgba(255, 0, 0, 0.2)' : 'none',
                  color: favoritos.length > 0 ? '#ff4b2b' : 'inherit' 
                }}
              >
                <span style={{ fontWeight: 'bold' }}>❤️ MIS FAVORITOS</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  background: favoritos.length > 0 ? '#ff4b2b' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {favoritos.length}
                </span>
              </li>
              
              {/* SECCIONES CON ACORDEÓN */}
              {[
                { id: 'gastronomia', label: '🍴 GASTRONOMÍA' },
                { id: 'consultorios', label: '🩺 CONSULTORIOS' },
                { id: 'heladeria', label: '🍦 HELADERÍA' },
                { id: 'belleza', label: ' 👨‍🦱👩‍🦰BELLEZA' },
                { id: 'deportes', label: '🏋️⚽ DEPORTES'},
                { id: 'perfumes', label: '🧴 PERFUMES'},
                { id: 'cocteles', label: '🍹 COCTELES' },
                { id: 'estanquillos', label: '🍾 ESTANQUILLOS'}

              ].map((seccion) => (
                <div key={seccion.id} style={{ marginBottom: '10px' }}>
                  <li 
                    onClick={() => toggleAcordeon(seccion.id)} 
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '10px 0',
                      color: acordeonAbierto === seccion.id ? 'var(--accent)' : 'inherit'
                    }}
                  >
                    <span>{seccion.label}</span> 
                    <span style={{ transition: 'transform 0.3s', transform: acordeonAbierto === seccion.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </li>
                  {acordeonAbierto === seccion.id && renderSubmenu(seccion.id)}
                </div>
              ))}

              {/* PANEL ADMIN */}
              {esAdmin && (
                <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(0, 242, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                  <li style={{ color: 'var(--accent)', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '10px', listStyle: 'none' }}>
                    ADMINISTRACIÓN 🔒
                  </li>
                  <li onClick={() => { setVerMetricas(false); setMenuAbierto(false); }} 
                      style={{ cursor: 'pointer', padding: '10px 0', fontSize: '0.9rem', color: !verMetricas ? 'var(--accent)' : 'inherit', listStyle: 'none' }}>
                     { !verMetricas ? "● GESTIONANDO SITIOS" : "✏️ EDITAR SITIOS" }
                  </li>
                  <li onClick={() => { if (typeof obtenerMetricas === 'function') obtenerMetricas(); setVerMetricas(true); setMenuAbierto(false); }} 
                      style={{ cursor: 'pointer', padding: '10px 0', fontSize: '0.9rem', color: verMetricas ? 'var(--accent)' : 'inherit', listStyle: 'none' }}>
                     { verMetricas ? "● VIENDO ESTADÍSTICAS" : "📊 VER ESTADÍSTICAS" }
                  </li>
                </div>
              )}
            </ul>
          </div>

          {/* CAMBIO DE TEMA - FUERA DEL SCROLL */}
          <li onClick={() => { toggleTema(); setMenuAbierto(false); }} 
              style={{ 
                marginTop: 'auto', 
                borderTop: '1px solid rgba(255,255,255,0.1)', 
                paddingTop: '20px', 
                cursor: 'pointer', 
                color: 'var(--accent)', 
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: 'bold',
                listStyle: 'none'
              }}>
            {tema === 'dark' ? '☀️ CAMBIAR A MODO CLARO' : '🌙 CAMBIAR A MODO OSCURO'}
          </li>
        </div>
      </nav>

      {/* BOTÓN HAMBURGUESA */}
      <div className={`hamburguesa-btn ${menuAbierto ? 'activo' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)} style={{ zIndex: 2000 }}>
        <span></span><span></span><span></span>
      </div>

      {/* OVERLAY */}
      {menuAbierto && (
        <div className="menu-overlay-bg aparecer" onClick={() => setMenuAbierto(false)} 
             style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 998 }}>
        </div>
      )}
    </>
  );
}