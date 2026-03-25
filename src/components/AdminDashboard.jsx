import { useState } from 'react';
import { db } from '../services/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { useRestaurantes } from '../hooks/useRestaurantes'; 

export default function AdminDashboard({ metricasData, mesFiltro, setMesFiltro, eliminarMetricasRestaurante }) {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // --- Lógica del Hook ---
  const { submenusSalud, agregarSalud, borrarSalud, añadirCategoria } = useRestaurantes();
  
  const [nuevoSubmenu, setNuevoSubmenu] = useState("");
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [categoria, setCategoria] = useState('');

  const handleGuardarSalud = async () => {
    if (nuevoSubmenu.trim()) {
      await agregarSalud(nuevoSubmenu);
      setNuevoSubmenu("");
    }
  };

  const guardarSitioSalud = async (e) => {
    e.preventDefault();
    const nuevoSitioSalud = {
      nombre: nombre,
      direccion: direccion,
      telefono: telefono,
      Categoria: categoria, 
      horario: "Atención 24 Horas",
      linkWhatsapp: `https://wa.me/57${telefono}`
    };

    try {
      await addDoc(collection(db, "SALUD"), nuevoSitioSalud);
      alert("✅ Centro de Salud agregado con éxito");
      setNombre(''); setDireccion(''); setTelefono(''); setCategoria('');
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      alert("Hubo un error al guardar");
    }
  };

  // Función puente para conectar el formulario con el Hook (Ya adaptada a objetos)
  const handleCrearCategoriaMaestra = async (nombreCat, tipoCat) => {
    if(!nombreCat) return alert("Escribe un nombre para la categoría");
    
    // Llamamos a la función del hook que ahora recibe parámetros
    // Si tu hook aún usa prompts, esta función los saltará si ya recibe los argumentos
    await añadirCategoria(nombreCat, tipoCat);
    
    // Limpieza de inputs
    document.getElementById('nombreCat').value = "";
    alert(`Categoría "${nombreCat.toUpperCase()}" creada correctamente 🚀`);
  };

  return (
    <div className="aparecer" style={{maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'white'}}>
      
      {/* SECCIÓN DE MÉTRICAS */}
      <div style={{textAlign: 'center', marginBottom: '25px'}}>
        <h2 style={{color: 'var(--accent)', textShadow: '0 0 10px var(--accent)'}}>REYES DE PIZINGO 👑</h2>
        <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="search-input">
          {meses.map((mes, i) => (
            <option key={i} value={i}>{mes}</option>
          ))}
        </select>
      </div>

      <table style={{width: '100%', borderCollapse: 'collapse', color: 'white', marginBottom: '40px'}}>
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
              <td style={{padding: '15px', fontWeight: 'bold'}}>{item.nombre.includes("VISITAS TOTALES") ? "⭐" : (i === 0 ? "🥇" : `#${i + 1}`)}</td>
              <td style={{padding: '15px'}}>{item.nombre}</td>
              <td style={{padding: '15px', textAlign: 'center', color: 'var(--accent)', fontWeight: 'bold'}}>{item.clics}</td>
              <td style={{padding: '15px', textAlign: 'center'}}>
                <button onClick={() => eliminarMetricasRestaurante(item.nombre)} style={{ background: '#ff4b2b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.7rem' }}>RESETEAR 🗑️</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" style={{padding: '30px', textAlign: 'center', opacity: 0.6}}>No hay datos registrados.</td></tr>
          )}
        </tbody>
      </table>

      {/* --- NUEVA GESTIÓN DE CATEGORÍAS POR NICHO (SELECTOR VISUAL) --- */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        padding: '25px', 
        borderRadius: '15px', 
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '30px' 
      }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '10px' }}>🏷️ CREAR CATEGORÍA MAESTRA</h3>
        <p style={{fontSize: '0.8rem', opacity: 0.7, marginBottom: '20px'}}>
          Define el nombre y el nicho al que pertenecerá la categoría global.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <input 
            className="search-input" 
            placeholder="Nombre: Ej. Sushi, Odontología, Mascotas..." 
            id="nombreCat"
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="search-input" id="tipoCat" style={{ flex: 1 }}>
              <option value="restaurantes">🍴 Restaurantes</option>
              <option value="salud">🏥 Salud</option>
              <option value="heladeria">🍦 Heladería</option>
              <option value="barberia">✂️ Barbería</option>
            </select>
            <button 
              onClick={() => {
                const n = document.getElementById('nombreCat').value;
                const t = document.getElementById('tipoCat').value;
                handleCrearCategoriaMaestra(n, t);
              }}
              style={{ 
                background: 'var(--accent)', 
                color: 'black',
                padding: '0 25px', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              CREAR 🚀
            </button>
          </div>
        </div>
      </div>

      {/* GESTIÓN DE CATEGORÍAS/SUBMENÚS DE SALUD */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)', 
        padding: '25px', 
        borderRadius: '15px', 
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{color: 'var(--accent)', marginBottom: '15px'}}>📁 GESTIONAR SUBMENÚS DE SALUD</h3>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <input 
            className="search-input"
            value={nuevoSubmenu} 
            onChange={(e) => setNuevoSubmenu(e.target.value)} 
            placeholder="Ej: Farmacias, Gimnasios..."
            style={{flex: 1}}
          />
          <button onClick={handleGuardarSalud} style={{background: 'var(--accent)', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'black'}}>Agregar</button>
        </div>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
          {submenusSalud.map(item => (
            <div key={item.id} style={{
              background: 'rgba(0,242,255,0.1)', 
              padding: '8px 15px', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              border: '1px solid var(--accent)'
            }}>
              <span style={{fontSize: '0.9rem'}}>{item.nombre}</span>
              <button onClick={() => borrarSalud(item.id)} style={{background: 'transparent', border: 'none', color: '#ff4b2b', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* REGISTRAR NUEVO SITIO DE SALUD */}
      <div style={{
        background: 'rgba(0, 242, 255, 0.05)', 
        padding: '25px', 
        borderRadius: '15px', 
        border: '1px solid var(--accent)',
        boxShadow: '0 0 15px rgba(0, 242, 255, 0.1)'
      }}>
        <h3 style={{color: 'var(--accent)', marginBottom: '20px', textAlign: 'center'}}>🏥 REGISTRAR NUEVO CENTRO (DATOS)</h3>
        <form onSubmit={guardarSitioSalud} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <input className="search-input" type="text" placeholder="Nombre (ej: Clínica Central)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            
            <select className="search-input" value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
                <option value="">Seleccionar Categoría</option>
                {submenusSalud.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
            </select>
          </div>
          
          <input className="search-input" type="text" placeholder="Dirección Exacta" value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
          <input className="search-input" type="number" placeholder="WhatsApp / Teléfono (sin +57)" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          
          <button type="submit" style={{
            marginTop: '10px', 
            background: 'var(--accent)', 
            color: 'black', 
            border: 'none', 
            padding: '15px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}>
            Añadir a PISINGO Salud 🚀
          </button>
        </form>
      </div>
    </div>
  );
}