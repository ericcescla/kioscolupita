import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Search, ShoppingCart } from 'lucide-react';
import { errorMessage, productoService } from '../services/api';
import type { Producto } from '../types/producto';

const money = (price: number | string) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(Number(price));

export default function ListaPrecios() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await productoService.listar());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.categoria))], [products]);
  const filtered = useMemo(() => products.filter((product) =>
    (category === 'Todos' || product.categoria === category) &&
    product.nombre.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')),
  ), [products, category, query]);

  return <main className="page prices-page">
    {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadProducts()}>Reintentar</button></div>}
    <section className="catalog" id="precios">
      <h1>lista de precios</h1>
      <div className="toolbar">
        <label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="buscar producto..." aria-label="Buscar producto" /></label>
        <div className="categories" aria-label="Filtrar por categoría">
          {categories.map((value) => <button type="button" key={value} className={`category-chip ${category === value ? 'selected' : ''}`} onClick={() => setCategory(value)}>{value.toLocaleLowerCase('es')}</button>)}
        </div>
      </div>
      <div className="results-line">
        {loading ? 'Cargando productos…' : `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`}
        {(query || category !== 'Todos') && <button className="text-button" type="button" onClick={() => { setQuery(''); setCategory('Todos'); }}>Limpiar filtros</button>}
      </div>
      {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /> Consultando la lista de precios…</div>
        : filtered.length ? <div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.id}>
          <ShoppingCart className="product-cart" size={24} strokeWidth={1.6} />
          <h2 className="product-name">{product.nombre}</h2>
          <span className="product-category">{product.categoria}</span>
          <div className="product-price">{money(product.precio)}</div>
        </article>)}</div>
          : <div className="empty-state">{products.length ? 'No encontramos ese producto.' : 'Todavía no hay productos cargados.'}</div>}
    </section>
  </main>;
}

