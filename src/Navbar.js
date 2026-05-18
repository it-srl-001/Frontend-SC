import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Truck, ShoppingCart, LogOut, Wrench, 
  Receipt, CreditCard, Users, Shield, Menu, X, ClipboardCheck
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- LÓGICA DE PERMISOS (Sincronizada con App.js) ---
  const userRole = (user?.rol || user?.role || '').toLowerCase().trim();
  const userEmail = (user?.email || '').toLowerCase().trim();
  
  const isAdmin = userRole === 'admin';
  const isMoreno = userEmail === 'it@alphaquimicasrl.com.ar' || 
                   userEmail === 'it@alphaquica.com.ar';

  // Logística es para Moreno o Administradores
  const isLogistics = isAdmin || isMoreno;

  const handleLogoutClick = () => {
    onLogout(); // Esto limpia el localStorage en App.js
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  // --- ESTILOS DINÁMICOS PARA MOBILE ---
  const menuStyles = isMobile 
    ? {
        position: 'absolute',
        top: '65px',
        left: 0,
        width: '100%',
        backgroundColor: '#1e293b',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.4s ease-in-out',
        maxHeight: isMenuOpen ? '800px' : '0px',
        opacity: isMenuOpen ? 1 : 0,
        padding: isMenuOpen ? '20px' : '0 20px',
        boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
        pointerEvents: isMenuOpen ? 'auto' : 'none',
        zIndex: 999
      }
    : {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        maxHeight: 'none',
        opacity: 1,
        pointerEvents: 'auto'
      };

  return (
    <nav style={styles.nav}>
      <div style={styles.topBar}>
        <Link to="/" style={styles.logo} onClick={closeMenu}>
          <Shield size={24} color="#0ea5e9" />
          <span style={styles.logoText}>Alpha Química</span>
        </Link>

        {isMobile && (
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.menuBtn}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        )}
      </div>

      <div style={menuStyles}>
        <div style={isMobile ? styles.mobileStack : styles.desktopStack}>
          {/* ACCESO UNIVERSAL */}
          <Link to="/solicitudes" style={styles.link} onClick={closeMenu}>
            <FileText size={18} /> Solicitudes
          </Link>

          {/* ACCESO LOGÍSTICA */}
          {isLogistics && (
            <>
              {!isMobile && <div style={styles.divider} />}
              <Link to="/vehiculos" style={styles.link} onClick={closeMenu}>
                <Truck size={18} /> Vehículos
              </Link>
              <Link to="/ordenes-trabajo" style={styles.link} onClick={closeMenu}>
                <Wrench size={18} /> O. Trabajo
              </Link>
            </>
          )}

          {/* ACCESO ADMINISTRACIÓN */}
          {isAdmin && (
            <>
              {!isMobile && <div style={styles.divider} />}
              <Link to="/proveedores" style={styles.link} onClick={closeMenu}>
                <Truck size={18} /> Proveedores
              </Link>
              <Link to="/compras" style={styles.link} onClick={closeMenu}>
                <ShoppingCart size={18} /> Compras
              </Link>
              <Link to="/recibos" style={styles.link} onClick={closeMenu}>
                <Receipt size={18} /> Recibos
              </Link>
              <Link to="/facturas" style={styles.link} onClick={closeMenu}>
                <ClipboardCheck size={18} /> Facturas
              </Link>
              <Link to="/pagos" style={styles.link} onClick={closeMenu}>
                <CreditCard size={18} /> Pagos
              </Link>
              <Link to="/usuarios" style={styles.link} onClick={closeMenu}>
                <Users size={18} /> Usuarios
              </Link>
            </>
          )}
        </div>

        {/* SECCIÓN DE USUARIO */}
        <div style={{
          ...styles.userSection, 
          borderTop: isMobile ? '1px solid #334155' : 'none', 
          marginTop: isMobile ? '15px' : '0',
          paddingTop: isMobile ? '15px' : '0',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          <div style={isMobile ? {textAlign: 'left'} : styles.userInfo}>
            <span style={styles.userName}>{user?.nombre || 'Usuario'}</span>
            <span style={{
              ...styles.roleTag, 
              background: isAdmin ? '#0ea5e9' : (isMoreno ? '#10b981' : '#64748b')
            }}>
              {userRole}
            </span>
          </div>
          <button onClick={handleLogoutClick} style={styles.logoutBtn}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: { 
    background: '#1e293b', 
    color: 'white', 
    position: 'sticky', 
    top: 0, 
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '65px',
    padding: '0 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: '20px'
  },
  logo: { 
    display: 'flex', alignItems: 'center', gap: '10px', 
    color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '20px' 
  },
  logoText: { whiteSpace: 'nowrap' },
  menuBtn: {
    background: '#334155', border: 'none', color: 'white', cursor: 'pointer', 
    padding: '8px', borderRadius: '8px', marginLeft: '10px'
  },
  desktopStack: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px' },
  mobileStack: { display: 'flex', flexDirection: 'column', gap: '5px' },
  link: { 
    color: '#cbd5e1', textDecoration: 'none', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', borderRadius: '8px', whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  divider: { width: '1px', height: '20px', background: '#334155', margin: '0 5px' },
  userSection: { 
    display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto'
  },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontSize: '12px', fontWeight: 'bold', color: '#f1f5f9' },
  roleTag: { fontSize: '9px', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' },
  logoutBtn: { 
    background: '#ef4444', color: 'white', border: 'none', 
    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold',
    transition: 'background 0.2s'
  }
};

export default Navbar;
