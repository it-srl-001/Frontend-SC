import React, { useEffect, useMemo, useState } from 'react';
import api from './api';
import { FileText, Loader2, Save, Trash2 } from 'lucide-react';

const ADMIN_DELETE_EMAIL = 'admin@sistema.com';

const Facturas = ({ user }) => {
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    orden_compra_id: '',
    proveedor: '',
    descripcion: '',
    solicitado_por: '',
    fecha: new Date().toISOString().slice(0, 10),
    numero_factura: '',
    condicion_pago: '',
    monto_total: '',
    moneda: 'PESOS',
    tipo_iva: 'FINAL',
  });

  const canDelete = (user?.email || '').toLowerCase().trim() === ADMIN_DELETE_EMAIL;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resOrdenes, resFacturas] = await Promise.all([
        api.get('/api/ordenes-compra'),
        api.get('/api/facturas'),
      ]);
      setOrdenes(resOrdenes.data || []);
      setFacturas(resFacturas.data || []);
    } catch (err) {
      console.error('Error cargando facturas:', err);
      alert('No se pudieron cargar los datos de facturas.');
    }
  };

  const ordenSeleccionada = useMemo(() => {
    return ordenes.find((orden) => String(orden.id) === String(form.orden_compra_id));
  }, [ordenes, form.orden_compra_id]);

  const describirOrden = (orden) => {
    const items = Array.isArray(orden?.items) ? orden.items : [];
    if (items.length > 0) {
      return items
        .map((item) => [item.producto, item.cantidad ? `x${item.cantidad}` : null].filter(Boolean).join(' '))
        .join(' / ');
    }
    return orden?.especificaciones || '';
  };

  const obtenerSolicitante = (orden) => {
    return orden?.solicitud?.solicitante || orden?.solicitante || orden?.autoriza || '';
  };

  const seleccionarOrden = (id) => {
    const orden = ordenes.find((item) => String(item.id) === String(id));
    if (!orden) {
      setForm({
        ...form,
        orden_compra_id: '',
        proveedor: '',
        descripcion: '',
        solicitado_por: '',
      });
      return;
    }

    setForm({
      ...form,
      orden_compra_id: id,
      proveedor: orden.proveedorNombre || orden.proveedor || '',
      descripcion: describirOrden(orden),
      solicitado_por: obtenerSolicitante(orden),
      condicion_pago: orden.condicionPago || orden.formaPago || form.condicion_pago,
    });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        orden_compra_id: form.orden_compra_id ? Number(form.orden_compra_id) : null,
        monto_total: Number(form.monto_total),
      };

      await api.post('/api/facturas', payload);
      alert('Factura registrada con exito.');
      setForm({
        orden_compra_id: '',
        proveedor: '',
        descripcion: '',
        solicitado_por: '',
        fecha: new Date().toISOString().slice(0, 10),
        numero_factura: '',
        condicion_pago: '',
        monto_total: '',
        moneda: 'PESOS',
        tipo_iva: 'FINAL',
      });
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (factura) => {
    if (!canDelete) return;
    const ok = window.confirm(`Borrar factura ${factura.numero_factura}?`);
    if (!ok) return;

    try {
      await api.delete(`/api/facturas/${factura.id}`);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const formatoMoneda = (factura) => {
    const simbolo = factura.moneda === 'USD' ? 'U$D' : '$';
    return `${simbolo} ${Number(factura.monto_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}><FileText size={26} /> Carga de Facturas</h2>

        <form onSubmit={enviar} style={styles.form}>
          <div style={styles.full}>
            <label style={styles.label}>Orden de compra</label>
            <select style={styles.input} value={form.orden_compra_id} onChange={(e) => seleccionarOrden(e.target.value)}>
              <option value="">Seleccionar orden...</option>
              {ordenes.map((orden) => (
                <option key={orden.id} value={orden.id}>
                  OC-{String(orden.id).padStart(4, '0')} | {orden.proveedorNombre || orden.proveedor} | {obtenerSolicitante(orden) || 'Sin solicitante'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Proveedor</label>
            <input style={styles.input} value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} required />
          </div>
          <div>
            <label style={styles.label}>Solicito</label>
            <input style={styles.input} value={form.solicitado_por} onChange={(e) => setForm({ ...form, solicitado_por: e.target.value })} />
          </div>
          <div style={styles.full}>
            <label style={styles.label}>Descripcion</label>
            <textarea style={styles.textarea} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>

          <div>
            <label style={styles.label}>Fecha</label>
            <input style={styles.input} type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          </div>
          <div>
            <label style={styles.label}>Numero de factura</label>
            <input style={styles.input} value={form.numero_factura} onChange={(e) => setForm({ ...form, numero_factura: e.target.value })} required />
          </div>
          <div>
            <label style={styles.label}>Condicion de pago</label>
            <input style={styles.input} value={form.condicion_pago} onChange={(e) => setForm({ ...form, condicion_pago: e.target.value })} required />
          </div>
          <div>
            <label style={styles.label}>Monto total</label>
            <input style={styles.input} type="number" step="0.01" min="0" value={form.monto_total} onChange={(e) => setForm({ ...form, monto_total: e.target.value })} required />
          </div>
          <div>
            <label style={styles.label}>Moneda</label>
            <select style={styles.input} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              <option value="PESOS">Pesos</option>
              <option value="USD">Dolares</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>IVA / Final</label>
            <select style={styles.input} value={form.tipo_iva} onChange={(e) => setForm({ ...form, tipo_iva: e.target.value })}>
              <option value="FINAL">Final</option>
              <option value="IVA">Tiene IVA</option>
            </select>
          </div>

          {ordenSeleccionada && (
            <div style={styles.infoBox}>
              Datos tomados de OC-{String(ordenSeleccionada.id).padStart(4, '0')}: proveedor, descripcion y solicitante.
            </div>
          )}

          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? <Loader2 size={18} /> : <><Save size={18} /> Guardar factura</>}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={styles.header}>Facturas cargadas</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Solicito</th>
                <th style={styles.th}>Factura</th>
                <th style={styles.th}>Total</th>
                {canDelete && <th style={{ ...styles.th, textAlign: 'right' }}>Borrar</th>}
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr><td colSpan={canDelete ? 6 : 5} style={styles.empty}>No hay facturas cargadas.</td></tr>
              ) : facturas.map((factura) => (
                <tr key={factura.id}>
                  <td style={styles.td}>{new Date(factura.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={styles.td}>{factura.proveedor}</td>
                  <td style={styles.td}>{factura.solicitado_por || 'S/D'}</td>
                  <td style={styles.td}>{factura.numero_factura}</td>
                  <td style={styles.td}>{formatoMoneda(factura)}</td>
                  {canDelete && (
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button style={styles.btnDelete} onClick={() => eliminar(factura)} title="Borrar factura">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px 10px', backgroundColor: '#f1f5f9', minHeight: '100vh', boxSizing: 'border-box' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '1050px', margin: '0 auto 22px', boxShadow: '0 8px 18px rgba(15,23,42,0.08)' },
  header: { display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', margin: '0 0 18px', fontSize: '22px', fontWeight: '800' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  full: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: 'white' },
  textarea: { width: '100%', minHeight: '72px', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' },
  infoBox: { gridColumn: '1 / -1', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#075985', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
  btnSubmit: { gridColumn: '1 / -1', background: '#0f172a', color: 'white', border: 'none', padding: '13px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '760px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
  empty: { padding: '24px', textAlign: 'center', color: '#94a3b8' },
  btnDelete: { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' },
};

export default Facturas;
