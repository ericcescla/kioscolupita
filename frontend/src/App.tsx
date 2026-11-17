import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AgregarProducto from './pages/AgregarProducto';
import ListaPrecios from './pages/ListaPrecios';

function AppLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return <>
    <header className="topbar">
      <NavLink className="brand" to="/precios" aria-label="Kiosco Lupita, lista de precios">kiosco lupita</NavLink>
      <nav aria-label="Navegación principal">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/precios">lista de precios</NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/agregar-producto">agregar producto</NavLink>
      </nav>
    </header>
    <Outlet />
  </>;
}

export default function App() {
  return <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/precios" replace />} />
      <Route path="precios" element={<ListaPrecios />} />
      <Route path="agregar-producto" element={<AgregarProducto />} />
      <Route path="*" element={<Navigate to="/precios" replace />} />
    </Route>
  </Routes>;
}

