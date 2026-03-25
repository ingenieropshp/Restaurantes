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
  favoritos = [] // Recibe la lista de IDs favoritos
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const [restaurantesAbierto, setRestaurantesAbierto] = useState(false);
  const [saludAbierto, setSaludAbierto] = useState(false);
  const [heladeriaAbierto, setHeladeriaAbierto] = useState(false);
  const [barberiaAbierto, setBarberiaAbierto] = useState(false);

  const manejarFiltro = (catNombre) => {
    const nombreFinal = typeof catNombre === 'object' ? catNombre.nombre : catNombre;
    setFiltroCategoria(nombreFinal);
    setVerMetricas(false); 
    setMenuAbierto(false);
  };

  // --- LÓGICA DE RENDERIZADO CORREGIDA ---
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
      <ul className="submenu-categorias" style={{ 
        listStyle: 'none', paddingLeft: '15px', background: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto', borderLeft: '2px solid var(--accent)' 
      }}>
        
        {filtradas.map((cat, index) => (
          <li key={index} onClick={() => manejarFiltro(cat.nombre)} 
              style={{ fontSize: '0.85rem', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '10px' }}>
            <span>{String(cat.nombre).toUpperCase()}</span>
            <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>({cat.totalSitios})</span>
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
          <h2 style={{ color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '5px' }}>
            {branding?.titulo} <span>🦆</span>
          </h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, fontStyle: 'italic', marginBottom: '15px' }}>
            {branding?.slogan}
          </p>
          
          <hr style={{ borderColor: 'rgba(0,242,255,0.1)', margin: '15px 0' }} />
          
          <ul className="hamburguesa-links" style={{ listStyle: 'none', padding: 0 }}>
            <li onClick={() => manejarFiltro("Todos")} style={{ cursor: 'pointer', marginBottom: '15px' }}>
              🏠 TODOS
            </li>

            {/* OPCIÓN DE FAVORITOS CON LÓGICA DE ESTADO VACÍO */}
            <li 
              onClick={() => manejarFiltro("Favoritos")} 
              style={{ 
                cursor: 'pointer', 
                marginBottom: '15px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                color: favoritos.length > 0 ? 'var(--accent)' : 'inherit' 
              }}
            >
              <span>❤️ MIS FAVORITOS</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({favoritos.length})</span>
            </li>
            
            <li onClick={() => setRestaurantesAbierto(!restaurantesAbierto)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span>🍴 RESTAURANTES</span> <span>{restaurantesAbierto ? '▲' : '▼'}</span>
            </li>
            {restaurantesAbierto && renderSubmenu("restaurantes")}

            <li onClick={() => setSaludAbierto(!saludAbierto)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span>🏥 SALUD</span> <span>{saludAbierto ? '▲' : '▼'}</span>
            </li>
            {saludAbierto && renderSubmenu("salud")}

            <li onClick={() => setHeladeriaAbierto(!heladeriaAbierto)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span>🍦 HELADERIA</span> <span>{heladeriaAbierto ? '▲' : '▼'}</span>
            </li>
            {heladeriaAbierto && renderSubmenu("heladeria")}

            <li onClick={() => setBarberiaAbierto(!barberiaAbierto)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span>✂️ BARBERIA</span> <span>{barberiaAbierto ? '▲' : '▼'}</span>
            </li>
            {barberiaAbierto && renderSubmenu("barberia")}

            {esAdmin && (
              <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(0, 242, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(0, 242, 255, 0.1)' }}>
                <li style={{ color: 'var(--accent)', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '10px', listStyle: 'none' }}>CONTROL DE ADMIN</li>
                <li onClick={() => { setVerMetricas(false); setMenuAbierto(false); }} style={{ cursor: 'pointer', padding: '8px 0', fontSize: '0.9rem', color: !verMetricas ? 'var(--accent)' : 'inherit', listStyle: 'none' }}>
                    { !verMetricas ? "● GESTIONANDO SITIOS" : "✏️ EDITAR SITIOS" }
                </li>
                <li onClick={() => { if (typeof obtenerMetricas === 'function') obtenerMetricas(); setVerMetricas(true); setMenuAbierto(false); }} style={{ cursor: 'pointer', padding: '8px 0', fontSize: '0.9rem', color: verMetricas ? 'var(--accent)' : 'inherit', listStyle: 'none' }}>
                    { verMetricas ? "● VIENDO ESTADÍSTICAS" : "📊 VER ESTADÍSTICAS" }
                </li>
              </div>
            )}

            <li onClick={() => { toggleTema(); setMenuAbierto(false); }} style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.8rem' }}>
              {tema === 'dark' ? '☀️ MODO CLARO' : '🌙 MODO OSCURO'}
            </li>
          </ul>
        </div>
      </nav>

      <div className={`hamburguesa-btn ${menuAbierto ? 'activo' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)} style={{ zIndex: 2000 }}>
        <span></span><span></span><span></span>
      </div>

      {menuAbierto && (
        <div className="menu-overlay-bg Aparecer" onClick={() => setMenuAbierto(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 998 }}></div>
      )}
    </>
  );
}