import React, { useState, useEffect } from 'react';
import api from './api';
import { Receipt, Plus, Download, Loader2, DollarSign, User, FileText, CreditCard } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Recibos = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    emisor: '', 
    receptor: '', 
    concepto: '', // Corregido: antes decía 'concept'
    monto: '', 
    condicion_pago: 'Transferencia' 
  });

  useEffect(() => {
    fetchRecibos();
  }, []);

// ✅ PARA CARGAR RECIBOS
const fetchRecibos = async () => {
  try {
    const res = await api.get('/api/recibos'); // Agregamos /api/ aquí
    setRecibos(res.data || []);
  } catch (err) {
    console.error(err.message); 
  }
};

// ✅ PARA ENVIAR EL FORMULARIO
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Construimos el objeto EXACTO que pide el DTO del Backend
    const payload = { 
      // Generamos un número de recibo automático basado en la hora actual
      numero_recibo: `REC-${Date.now().toString().slice(-6)}`, 
      
      emisor: form.emisor, 
      receptor: form.receptor, 
      concepto: form.concepto, 
      monto: Number(form.monto),
      condicion_pago: form.condicion_pago,
      
      // Opcional: Si no hay orden, mandamos null o un ID por defecto
      orden_id: form.orden_id ? Number(form.orden_id) : null 
    };

    // 2. Realizamos la petición a /api/recibos
    const res = await api.post('/api/recibos', payload); 
    
    alert("✅ Recibo generado y registrado con éxito");
    
    // 3. Generar PDF con la respuesta del servidor (que ya trae el ID)
    descargarPDF(res.data);

    // 4. Limpiar formulario
    setForm({ 
      emisor: 'Alpha Química S.A.', 
      receptor: '', 
      concepto: '', 
      monto: '', 
      condicion_pago: 'Transferencia' 
    });
    
    fetchRecibos();
  } catch (err) { 
    // Tu interceptor en api.js ya nos da el mensaje limpio en err.message
    console.error("Error capturado:", err.message);
    alert("❌ Error: " + err.message); 
  } finally {
    setLoading(false);
  }
};

  const descargarPDF = (r) => {
  if (!r) return;
  const doc = new jsPDF();
  
  const lightBlue = [224, 242, 254]; 
  const textColor = [0, 0, 0];      
  const margin = 20;

  // Encabezado
  doc.setFillColor(...lightBlue);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(...textColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ALPHA QUÍMICA S.R.L.", 105, 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("COMPROBANTE DE PAGO NO VÁLIDO COMO FACTURA", 105, 30, { align: 'center' });

  // Info Recibo - Usamos el ID que viene del backend
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const idFormateado = String(r.id || '0').padStart(5, '0');
  doc.text(`RECIBO DE CAJA R-${idFormateado}`, margin, 55);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const fechaMostrar = new Date(r.createdAt || Date.now()).toLocaleDateString('es-AR');
  doc.text(`Fecha: ${fechaMostrar}`, 190, 55, { align: 'right' });

  // Tabla de Contenido
  autoTable(doc, {
    startY: 65,
    head: [['Concepto', 'Información']],
    body: [
      ['EMISOR / PAGADOR', (r.emisor || "Alpha Química S.A.").toUpperCase()],
      ['RECEPTOR / BENEFICIARIO', (r.receptor || "").toUpperCase()],
      ['MOTIVO DEL PAGO', (r.concepto || "").toUpperCase()],
      ['MÉTODO UTILIZADO', (r.condicion_pago || "Transferencia").toUpperCase()],
      ['MONTO TOTAL', `$ ${Number(r.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: lightBlue, textColor: textColor },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  
  // Cuadro de Total
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, finalY, 170, 15, 'F');
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL RECIBIDO: $ ${Number(r.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 105, finalY + 10, { align: 'center' });

  // Firmas
  const firmaY = finalY + 45;
  doc.line(margin + 10, firmaY, margin + 70, firmaY); 
  doc.line(130, firmaY, 190, firmaY); 
  doc.setFontSize(8);
  doc.text("FIRMA EMISOR", margin + 40, firmaY + 5, { align: 'center' });
  doc.text("FIRMA RECEPTOR", 160, firmaY + 5, { align: 'center' });

  doc.save(`Recibo_Alpha_${r.id || 'nuevo'}.pdf`);
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerContainer}>
          <h2 style={styles.header}><Receipt size={28} /> Gestión de Recibos</h2>
          <span style={styles.subtitle}>Emisión de comprobantes de pago y movimientos de caja</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><User size={13}/> Emisor</label>
            <input style={styles.input} value={form.emisor} onChange={e => setForm({...form, emisor: e.target.value})} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><User size={13}/> Receptor</label>
            <input style={styles.input} placeholder="Beneficiario" value={form.receptor} onChange={e => setForm({...form, receptor: e.target.value})} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><DollarSign size={13}/> Importe</label>
            <input style={styles.input} type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><CreditCard size={13}/> Forma de Pago</label>
            <select style={styles.input} value={form.condicion_pago} onChange={e => setForm({...form, condicion_pago: e.target.value})}>
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div style={styles.fullWidth}>
            <label style={styles.label}><FileText size={13}/> Concepto Detallado</label>
            <textarea style={styles.textarea} placeholder="Detalle del pago..." value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} required />
          </div>
          <button type="submit" style={styles.btnSave} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> REGISTRAR Y GENERAR</>}
          </button>
        </form>

        <div style={styles.tableWrapper}>
          <h3 style={styles.tableTitle}>Historial</h3>
          <div style={styles.scrollContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Nº</th>
                  <th style={styles.th}>FECHA</th>
                  <th style={styles.th}>BENEFICIARIO</th>
                  <th style={styles.th}>MONTO</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {recibos.length > 0 ? recibos.map(r => (
                  <tr key={r.id} style={styles.tdRow}>
                    <td style={styles.td}>#{String(r.id).padStart(4, '0')}</td>
                    <td style={styles.td}>{r.fecha_emision ? new Date(r.fecha_emision).toLocaleDateString('es-AR') : 'S/D'}</td>                    <td style={styles.td}>{r.receptor}</td>
                    <td style={{...styles.td, fontWeight: 'bold', color: '#15803d'}}>$ {Number(r.monto).toLocaleString('es-AR')}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => descargarPDF(r)} style={styles.btnIcon}><Download size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={styles.empty}>No hay registros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px 10px', backgroundColor: '#f1f5f9', minHeight: '100vh', boxSizing: 'border-box' },
  card: { 
    background: 'white', borderRadius: '16px', padding: 'clamp(15px, 5%, 30px)', 
    maxWidth: '950px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', boxSizing: 'border-box' 
  },
  headerContainer: { marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' },
  header: { display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', margin: 0, fontSize: '20px', fontWeight: '800' },
  subtitle: { fontSize: '13px', color: '#64748b' },
  formGrid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '15px', marginBottom: '30px', background: '#f8fafc', padding: '20px', 
    borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' 
  },
  fullWidth: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', minHeight: '60px' },
  btnSave: { 
    gridColumn: '1 / -1', background: '#0f172a', color: 'white', border: 'none', 
    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' 
  },
  scrollContainer: { overflowX: 'auto', width: '100%' },
  tableWrapper: { marginTop: '10px' },
  tableTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  thRow: { textAlign: 'left', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '10px', color: '#64748b', fontSize: '11px' },
  tdRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 10px', fontSize: '13px' },
  btnIcon: { background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' },
  empty: { padding: '20px', textAlign: 'center', color: '#94a3b8' }
};

export default Recibos;