import React, { useState, useEffect } from 'react';
import api from './api'; 
import { 
  Send, Clock, CheckCircle, XCircle, FileText, Plus, 
  Trash2, Building2, Search, DollarSign, ChevronDown, ChevronUp, Link, Image, X
} from 'lucide-react';

const SolicitudCompra = ({ user }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroArea, setFiltroArea] = useState(''); 
  const [filtroEstado, setFiltroEstado] = useState('');
  const [items, setItems] = useState([{ producto: '', cantidad: 1 }]);
  
  // Estado para controlar qué fila está expandida
  const [expandidaId, setExpandidaId] = useState(null);

  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    area: '',
    solicitante: user?.nombre || '',
    justificacion: '',
    urgencia: 'MEDIA',
    monto_estimado: 'Hasta 200.000',
    link_referencia: '',
    imagen_referencia: ''
  });

  const departamentos = [
    "Calidad", "I+D", "Comercial", "Proyectos", "Mantenimiento", 
    "Recursos Humanos", "Logistica", "Produccion", "Administracion", 
    "Expedición", "Informática", "Brigada de emergencia", "Gestión interna"
  ];

  const cargarSolicitudes = async () => {
    if (!user?.id) return;
    try {
      // Se filtran por rol y usuario_id desde el backend
      const estadoParam = filtroEstado ? `&estado=${encodeURIComponent(filtroEstado)}` : '';
      const res = await api.get(`/api/solicitudes?rol=${user.rol}&usuario_id=${user.id}${estadoParam}`);
      setSolicitudes(res.data || []);
    } catch (err) {
      console.error("Error cargando solicitudes:", err);
    }
  };

  useEffect(() => {
    if (user) {
        setNuevaSolicitud(prev => ({ ...prev, solicitante: user.nombre }));
        cargarSolicitudes();
    }
  }, [user, filtroEstado]);

  const solicitudesFiltradas = solicitudes.filter(s => 
    s.area?.toLowerCase().includes(filtroArea.toLowerCase())
  );

  const agregarFila = () => setItems([...items, { producto: '', cantidad: 1 }]);
  
  const eliminarFila = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;
    setItems(nuevosItems);
  };

  const manejarImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleccione una imagen valida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNuevaSolicitud((prev) => ({ ...prev, imagen_referencia: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaSolicitud.area) return alert("Por favor, seleccione un Departamento / Área");
    
    setLoading(true);
    try {
      const payload = { 
        ...nuevaSolicitud, 
        items: items, 
        estado: 'En Revisión',
        usuario_id: user.id 
      };
      
      await api.post('/api/solicitudes', payload);
      alert("✅ Solicitud enviada correctamente");
      setItems([{ producto: '', cantidad: 1 }]);
      setNuevaSolicitud({ ...nuevaSolicitud, area: '', justificacion: '', link_referencia: '', imagen_referencia: '' });
      cargarSolicitudes();
    } catch (err) {
      const msg = err.response?.data?.message || "Error al procesar la solicitud";
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/api/solicitudes/${id}/estado`, { estado: nuevoEstado });
      cargarSolicitudes();
    } catch (err) {
      alert("Error al actualizar el estado");
    }
  };

  if (!user) return <div style={styles.loadingContainer}><Clock className="animate-spin" /> Cargando sesión...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}><FileText size={28} /> Gestión de Solicitudes de Compra</h2>
      </div>

      {/* FORMULARIO PARA USUARIOS (NO ADMIN) */}
      {user.rol !== 'admin' && (
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <Plus size={20} />
            <h3 style={styles.sectionTitle}>Crear Nueva Solicitud</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.gridForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Departamento / Área</label>
                <div style={{position:'relative', display:'flex', alignItems:'center'}}>
                  <Building2 size={16} style={{position:'absolute', left:'12px', color:'#94a3b8'}} />
                  <select 
                    style={{...styles.input, width: '100%', paddingLeft: '35px'}} 
                    required 
                    value={nuevaSolicitud.area} 
                    onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, area: e.target.value})}
                  >
                    <option value="">Seleccione un área...</option>
                    {departamentos.sort().map((dept, idx) => <option key={idx} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Prioridad</label>
                <select style={styles.input} value={nuevaSolicitud.urgencia} onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, urgencia: e.target.value})}>
                  <option value="BAJA">BAJA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="ALTA">ALTA</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Monto Estimado</label>
                <select style={{...styles.input, backgroundColor: '#f0f9ff'}} value={nuevaSolicitud.monto_estimado} onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, monto_estimado: e.target.value})}>
                  <option value="Hasta 200.000">Hasta $200.000</option>
                  <option value="Hasta 1.000.000">Hasta $1.000.000</option>
                  <option value="Mas de 1.000.000">Más de $1.000.000</option>
                </select>
              </div>
            </div>

            <div style={{marginTop: '20px'}}>
              <label style={styles.label}>Detalle de Insumos:</label>
              {items.map((item, index) => (
                <div key={index} style={styles.rowItem}>
                  <input style={{...styles.input, flex: 4}} placeholder="Producto" required value={item.producto} onChange={(e) => actualizarItem(index, 'producto', e.target.value)} />
                  <input style={{...styles.input, flex: 1}} type="number" min="1" required value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} />
                  <button type="button" onClick={() => eliminarFila(index)} style={styles.btnDelete}><Trash2 size={18}/></button>
                </div>
              ))}
              <button type="button" onClick={agregarFila} style={styles.btnAdd}><Plus size={14}/> Añadir línea</button>
            </div>

            <div style={{marginTop: '15px'}}>
                <label style={styles.label}>Justificación de la Compra</label>
                <textarea style={{...styles.input, width: '100%', minHeight: '80px'}} required value={nuevaSolicitud.justificacion} onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, justificacion: e.target.value})} placeholder="Explique brevemente por qué es necesario este pedido..." />
            </div>

            <div style={styles.referenceGrid}>
              <div>
                <label style={styles.label}>Link de referencia</label>
                <input
                  type="url"
                  style={{...styles.input, width: '100%'}}
                  placeholder="https://..."
                  value={nuevaSolicitud.link_referencia}
                  onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, link_referencia: e.target.value})}
                />
              </div>
              <div>
                <label style={styles.label}>Imagen / Foto</label>
                <label style={styles.fileButton}>
                  <Image size={16} /> Adjuntar o sacar foto
                  <input type="file" accept="image/*" capture="environment" onChange={manejarImagen} style={{display: 'none'}} />
                </label>
              </div>
            </div>

            {nuevaSolicitud.imagen_referencia && (
              <div style={styles.imagePreviewWrap}>
                <img src={nuevaSolicitud.imagen_referencia} alt="Referencia" style={styles.imagePreview} />
                <button type="button" onClick={() => setNuevaSolicitud({...nuevaSolicitud, imagen_referencia: ''})} style={styles.btnRemoveImage}>
                  <X size={14} /> Quitar imagen
                </button>
              </div>
            )}
            
            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? "Enviando..." : "ENVIAR SOLICITUD"} <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE SOLICITUDES / PANEL ADMIN */}
      <div style={styles.card}>
        <div style={styles.tableHeaderContainer}>
          <div style={styles.sectionHeader}>
            <Clock size={20} />
            <h3 style={styles.sectionTitle}>{user.rol === 'admin' ? "Panel de Autorizaciones" : "Mis Solicitudes"}</h3>
          </div>

          {user.rol === 'admin' && (
            <div style={styles.filtersContainer}>
              <div style={styles.searchContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Filtrar por Área..." 
                style={styles.searchInput}
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
              />
              </div>
              <select style={styles.estadoFilter} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="En Revisión">En revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="COMPRADO">Comprado</option>
              </select>
            </div>
          )}
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Origen / Usuario</th>
                <th style={styles.th}>Ítems</th>
                <th style={styles.th}>Monto Estimado</th>
                <th style={styles.th}>Prioridad</th>
                <th style={styles.th}>Estado</th>
                {user.rol === 'admin' && <th style={{...styles.th, textAlign: 'center'}}>Resolución</th>}
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.length > 0 ? solicitudesFiltradas.map((s) => (
                <React.Fragment key={s.id}>
                  {/* FILA PRINCIPAL - CLICABLE */}
                  <tr 
                    onClick={() => setExpandidaId(expandidaId === s.id ? null : s.id)}
                    style={{
                      ...styles.trBody, 
                      cursor: 'pointer',
                      backgroundColor: expandidaId === s.id ? '#f8fafc' : 'transparent'
                    }}
                  >
                    <td style={styles.td}>{new Date(s.createdAt || s.fecha_creacion).toLocaleDateString()}</td>
                    <td style={styles.td}>
                        <div style={{fontWeight:'700', color: '#1e293b'}}>{s.area}</div>
                        <div style={{fontSize:'12px', color:'#64748b'}}>{s.solicitante}</div>
                    </td>
                    <td style={styles.td}>
                      {(() => {
                        try {
                          const itemsParsed = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
                          return (
                            <div style={{display:'flex', alignItems:'center', gap: '5px', color: '#0369a1', fontWeight: '600'}}>
                              {itemsParsed?.length || 1} ítems {expandidaId === s.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </div>
                          );
                        } catch (e) { return <span>Ver detalle</span>; }
                      })()}
                    </td>
                    <td style={styles.td}>
                      <DollarSign size={12} style={{display:'inline'}}/> {s.monto_estimado}
                    </td>
                    <td style={styles.td}><span style={styles.urgenciaLabel(s.urgencia)}>{s.urgencia}</span></td>
                    <td style={styles.td}><span style={styles.badgeEstado(s.estado)}>{s.estado}</span></td>
                    {user.rol === 'admin' && (
                      <td style={{...styles.td, textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.actions}>
                          <button onClick={() => cambiarEstado(s.id, 'Aprobado')} style={styles.btnApprove} title="Aprobar"><CheckCircle size={22}/></button>
                          <button onClick={() => cambiarEstado(s.id, 'Rechazado')} style={styles.btnReject} title="Rechazar"><XCircle size={22}/></button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* FILA EXPANDIDA - JUSTIFICACIÓN */}
                  {expandidaId === s.id && (
                    <tr style={{backgroundColor: '#f8fafc'}} onClick={() => setExpandidaId(null)}>
                      <td colSpan={user.rol === 'admin' ? 7 : 6} style={{padding: '0 20px 20px 20px', borderBottom: '1px solid #e2e8f0'}}>
                        <div style={styles.expandedContent}>
                          <div style={{marginBottom: '15px'}}>
                            <h4 style={styles.detailLabel}>Justificación Detallada:</h4>
                            <p style={styles.detailText}>{s.justificacion || "Sin justificación cargada."}</p>
                          </div>
                          
                          <div>
                            <h4 style={styles.detailLabel}>Desglose de Ítems:</h4>
                            {(() => {
                              try {
                                const itemsParsed = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
                                return itemsParsed?.map((it, i) => (
                                  <div key={i} style={styles.itemDetailRow}>
                                    <span style={{fontWeight: '700', color: '#0369a1', width: '30px', display: 'inline-block'}}>{it.cantidad}x</span> 
                                    {it.producto}
                                  </div>
                                ));
                              } catch (e) { return <span>Error al leer ítems</span>; }
                            })()}
                          </div>
                          
                          {s.link_referencia && (
                            <div style={{marginTop: '15px'}}>
                              <a href={s.link_referencia} target="_blank" rel="noreferrer" style={styles.linkRef}>
                                <Link size={14} /> Ver Referencia / Link
                              </a>
                            </div>
                          )}

                          {s.imagen_referencia && (
                            <div style={{marginTop: '15px'}}>
                              <h4 style={styles.detailLabel}>Imagen / Foto:</h4>
                              <img src={s.imagen_referencia} alt="Referencia de solicitud" style={styles.detailImage} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr><td colSpan="7" style={styles.empty}>No se encontraron solicitudes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: '20px', borderLeft: '5px solid #0f172a', paddingLeft: '15px' },
  title: { color: '#0f172a', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  sectionTitle: { fontSize: '14px', fontWeight: '700', margin: 0, textTransform: 'uppercase' },
  gridForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outlineColor: '#3b82f6' },
  label: { fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' },
  rowItem: { display: 'flex', gap: '8px', marginBottom: '8px' },
  btnDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' },
  btnAdd: { background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b' },
  btnSubmit: { width: '100%', background: '#0f172a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', cursor: 'pointer' },
  tableHeaderContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  searchContainer: { position: 'relative', width: '100%', maxWidth: '300px' },
  filtersContainer: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  estadoFilter: { padding: '10px 12px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', color: '#334155', background: 'white' },
  referenceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' },
  fileButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px dashed #94a3b8', background: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#475569' },
  imagePreviewWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' },
  imagePreview: { width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  btnRemoveImage: { display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontWeight: '700' },
  table: { width: '100%', borderCollapse: 'collapse' },
  trHead: { background: '#f8fafc', borderBottom: '2px solid #f1f5f9' },
  th: { textAlign: 'left', padding: '12px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
  trBody: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' },
  td: { padding: '12px', fontSize: '13px' },
  badgeEstado: (e) => ({ 
    padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', 
    background: e === 'Aprobado' ? '#dcfce7' : e === 'Rechazado' ? '#fee2e2' : e === 'COMPRADO' ? '#e0f2fe' : '#fef3c7', 
    color: e === 'Aprobado' ? '#166534' : e === 'Rechazado' ? '#991b1b' : e === 'COMPRADO' ? '#0369a1' : '#92400e' 
  }),
  urgenciaLabel: (u) => ({ fontSize: '11px', fontWeight: '700', color: u === 'ALTA' ? '#dc2626' : '#64748b' }),
  actions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  btnApprove: { background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 0 },
  btnReject: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 },
  empty: { textAlign: 'center', padding: '30px', color: '#94a3b8' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '10px', color: '#64748b' },
  
  // ESTILOS DE EXPANSIÓN
  expandedContent: { 
    background: 'white', padding: '20px', borderRadius: '10px', 
    borderLeft: '4px solid #0f172a', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' 
  },
  detailLabel: { margin: '0 0 8px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  detailText: { margin: 0, fontSize: '14px', color: '#1e293b', lineHeight: '1.6' },
  itemDetailRow: { fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f8fafc', color: '#334155' },
  linkRef: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: '600' },
  detailImage: { maxWidth: '260px', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }
};

export default SolicitudCompra;
