import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, LoaderCircle, Pencil, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { errorMessage, productoService } from './services/api';
import type { Producto, ProductoInput } from './types/producto';

const categoryEmoji: Record<string, string> = { Bebidas: '🥤', Golosinas: '🍫', Snacks: '🍿', Almacén: '🛒', Lácteos: '🥛', Otros: '🧺' };
const money = (price: number | string) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(Number(price));

export default function App() {
  const isAddPage = window.location.pathname.replace(/\/+$/, '') === '/agregar-producto';
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [editing, setEditing] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<ProductoInput>({ nombre: '', categoria: 'Bebidas', precio: 0 });

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    try { setProducts(await productoService.listar()); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2500); return () => window.clearTimeout(timer); }, [toast]);

  const categories = useMemo(() => ['Todos', ...new Set(products.map((p) => p.categoria))], [products]);
  const filtered = useMemo(() => products.filter((p) => (category === 'Todos' || p.categoria === category) && p.nombre.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))), [products, category, query]);
  const resetForm = () => { setForm({ nombre: '', categoria: categories.find((value) => value !== 'Todos') || 'Bebidas', precio: 0 }); setEditing(null); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editing !== null) await productoService.actualizar(editing, form);
      else await productoService.crear(form);
      await loadProducts(); resetForm(); setToast(editing !== null ? 'Producto actualizado.' : 'Producto agregado.');
    } catch (cause) { setError(errorMessage(cause)); }
  }
  function beginEdit(product: Producto) { setEditing(product.id); setForm({ nombre: product.nombre, categoria: product.categoria, precio: Number(product.precio) }); document.querySelector('#administrar')?.scrollIntoView({ behavior: 'smooth' }); }
  async function remove(product: Producto) {
    if (!window.confirm(`¿Eliminar ${product.nombre} de la lista?`)) return;
    try { await productoService.eliminar(product.id); await loadProducts(); setToast('Producto eliminado.'); }
    catch (cause) { setError(errorMessage(cause)); }
  }

  return <>
    <header className="topbar">
      <a className="brand" href="/precios" aria-label="Kiosco Lupita, lista de precios">kiosco lupita</a>
      <nav aria-label="Navegación principal">
        <a className={`nav-link ${!isAddPage ? 'active' : ''}`} href="/precios">lista de precios</a>
        <a className={`nav-link ${isAddPage ? 'active' : ''}`} href="/agregar-producto">agregar producto</a>
      </nav>
    </header>
    <main className={isAddPage ? 'page add-page' : 'page prices-page'}>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadProducts()}>Reintentar</button></div>}
      {isAddPage ? <>
        <section className="add-section" id="administrar">
          <h1>agregar producto</h1>
          <form className="product-form" onSubmit={(event) => void submit(event)}>
            <label>nombre<input maxLength={120} required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="alfajor de chocolate" /></label>
            <label>categoría<select required value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })}>{[...new Set([...categories.filter((value) => value !== 'Todos'), 'Bebidas', 'Golosinas', 'Snacks', 'Almacén', 'Lácteos', 'Otros'])].map((value) => <option key={value} value={value}>{value.toLocaleLowerCase('es')}</option>)}</select></label>
            <label>precio<input required min="0.01" step="0.01" type="number" value={form.precio || ''} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} placeholder="ej. 1500" /></label>
            <div className="form-actions">{editing !== null && <button type="button" className="secondary-button" onClick={resetForm}><X size={15} /> cancelar</button>}<button type="submit" className="primary-button">{editing !== null ? <Check size={17} /> : <Plus size={19} />}{editing !== null ? 'guardar cambios' : 'agregar producto'}</button></div>
          </form>
        </section>
        <section className="manage-list-wrap" aria-label="Productos cargados">
          <div className="manage-list-head"><strong>Productos cargados</strong><span>{products.length} {products.length === 1 ? 'producto' : 'productos'}</span></div>
          <div className="manage-list">{loading ? <div className="list-empty">Cargando productos…</div> : products.length ? products.map((product) => <div className="manage-row" key={product.id}><div className="manage-product"><span className="product-emoji">{categoryEmoji[product.categoria] || '🧺'}</span><span><strong>{product.nombre}</strong><small>{product.categoria}</small></span></div><span className="manage-row-price">{money(product.precio)}</span><span className="row-actions"><button type="button" onClick={() => beginEdit(product)} aria-label={`Editar ${product.nombre}`} title="Editar"><Pencil size={16} /></button><button type="button" onClick={() => void remove(product)} aria-label={`Eliminar ${product.nombre}`} title="Eliminar"><Trash2 size={16} /></button></span></div>) : <div className="list-empty">Todavía no hay productos cargados.</div>}</div>
        </section>
      </> : <section className="catalog" id="precios">
        <h1>lista de precios</h1>
        <div className="toolbar"><label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="buscar producto..." aria-label="Buscar producto" /></label><div className="categories" aria-label="Filtrar por categoría">{categories.map((value) => <button type="button" key={value} className={`category-chip ${category === value ? 'selected' : ''}`} onClick={() => setCategory(value)}>{value.toLocaleLowerCase('es')}</button>)}</div></div>
        <div className="results-line">{loading ? 'Cargando productos…' : `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`}{(query || category !== 'Todos') && <button className="text-button" type="button" onClick={() => { setQuery(''); setCategory('Todos'); }}>Limpiar filtros</button>}</div>
        {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /> Consultando la lista de precios…</div> : filtered.length ? <div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.id}><ShoppingCart className="product-cart" size={24} strokeWidth={1.6} /><h2 className="product-name">{product.nombre}</h2><span className="product-category">{product.categoria}</span><div className="product-price">{money(product.precio)}</div></article>)}</div> : <div className="empty-state">{products.length ? 'No encontramos ese producto.' : 'Todavía no hay productos cargados.'}</div>}
      </section>}
    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
  </>;
}
