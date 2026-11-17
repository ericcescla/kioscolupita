import ListaPrecios from './pages/ListaPrecios';
import AgregarProducto from './pages/AgregarProducto';

export default function App() {
  const isAddPage = window.location.pathname.replace(/\/+$/, '') === '/agregar-producto';

  return <>
    <header className="topbar">
      <a className="brand" href="/precios" aria-label="Kiosco Lupita, lista de precios">kiosco lupita</a>
      <nav aria-label="Navegación principal">
        <a className={`nav-link ${!isAddPage ? 'active' : ''}`} href="/precios">lista de precios</a>
        <a className={`nav-link ${isAddPage ? 'active' : ''}`} href="/agregar-producto">agregar producto</a>
      </nav>
    </header>
    {isAddPage ? <AgregarProducto /> : <ListaPrecios />}
  </>;
}

