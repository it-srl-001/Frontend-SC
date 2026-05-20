import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Componentes Base
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Login from './Login';
import UsuariosGestion from './UsuariosGestion';

// Componentes de Compras / Administración
import Proveedores from './Proveedores';
import OrdenesCompra from './OrdenesCompra';
import OrdenesPago from './OrdenesPago';
import SolicitudCompra from './SolicitudCompra';
import Recibos from './Recibos';
import Facturas from './Facturas';

// Componentes de Logística
import Vehiculos from './Vehiculos';
import OrdenesTrabajo from './OrdenesTrabajo';

function App() {
  // Inicializamos el estado desde localStorage para persistir la sesión al recargar
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error al cargar usuario de localStorage", error);
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    // Ya lo guardamos en Login.jsx, pero lo reforzamos aquí por seguridad
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    // IMPORTANTE: Limpiar todo para que el interceptor de api.js no envíe datos viejos
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Si no hay usuario, mostramos la pantalla de Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Normalización de roles y permisos
  const userRole = (user?.rol || user?.role || '').toLowerCase().trim();
  const userEmail = (user?.email || '').toLowerCase().trim();
  
  const isAdmin = userRole === 'admin';

  // Lógica específica para Moreno (Logística)
  const isMoreno = userEmail === 'it@alphaquimicasrl.com.ar' || 
                   userEmail === 'it@alphaquimica.com.ar';

  const isLogistics = isMoreno || isAdmin;

  return (
    <Router>
      <div style={styles.app}>
        {/* Pasamos el usuario y la función de logout al Navbar */}
        <Navbar user={user} onLogout={handleLogout} />
        
        <main style={styles.main}>
          <Routes>
            {/* --- RUTAS ACCESIBLES PARA TODOS --- */}
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/solicitudes" element={<SolicitudCompra user={user} />} />

            {/* --- RUTAS DE LOGÍSTICA: Moreno o Admin --- */}
            {isLogistics && (
              <>
                <Route path="/vehiculos" element={<Vehiculos />} />
                <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
              </>
            )}

            {/* --- RUTAS DE ADMINISTRACIÓN: Solo Admin --- */}
            {isAdmin && (
              <>
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/compras" element={<OrdenesCompra user={user} />} />
                <Route path="/pagos" element={<OrdenesPago />} />
                <Route path="/recibos" element={<Recibos />} />
                <Route path="/facturas" element={<Facturas user={user} />} />
                <Route path="/usuarios" element={<UsuariosGestion />} />
              </>
            )}

            {/* Redirección por defecto si la ruta no existe o no tiene permiso */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const styles = {
  app: { 
    backgroundColor: '#f8fafc', 
    minHeight: '100vh', 
    fontFamily: "'Inter', sans-serif" 
  },
  main: { 
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  }
};

export default App;
