import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Search, ShoppingCart } from 'lucide-react';
import { errorMessage, productoService } from '../services/api';
import type { Producto } from '../types/producto';
import { capitalizeInitial } from '../utils/text';

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
      <h1>Lista de precios</h1>
      <div className="toolbar">
        <label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar producto..." aria-label="Buscar producto" /></label>
        <div className="categories" aria-label="Filtrar por categoría">
          {categories.map((value) => <button type="button" key={value} className={`category-chip ${category === value ? 'selected' : ''}`} onClick={() => setCategory(value)}>{capitalizeInitial(value)}</button>)}
        </div>
      </div>
      <div className="results-line">
        {(query || category !== 'Todos') && <button className="text-button" type="button" onClick={() => { setQuery(''); setCategory('Todos'); }}>Limpiar filtros</button>}
      </div>
      <section className="manage-list-wrap price-list-wrap" aria-label="Lista de precios">
        <div className="manage-list">
          {loading ? <div className="list-empty"><LoaderCircle className="spinner" size={17} /> Consultando la lista de precios…</div>
            : filtered.length ? filtered.map((product) => <article className="manage-row price-row" key={product.id}>
              <div className="manage-product"><span className="product-emoji"><ShoppingCart size={18} strokeWidth={1.7} /></span><span><strong>{capitalizeInitial(product.nombre)}</strong><small>{capitalizeInitial(product.categoria)}</small></span></div>
              <span className="manage-row-price">{money(product.precio)}</span>
            </article>)
              : <div className="list-empty">{products.length ? 'No encontramos ese producto.' : 'Todavía no hay productos cargados.'}</div>}
        </div>
      </section>
    </section>
  </main>;
}

