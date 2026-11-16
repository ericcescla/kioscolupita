import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, CalendarDays, Check, Heart, LoaderCircle, Pencil, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { errorMessage, productoService } from './services/api';
import type { Producto, ProductoInput } from './types/producto';

const categoryEmoji: Record<string, string> = { Bebidas: '🥤', Golosinas: '🍫', Snacks: '🍿', Almacén: '🛒', Lácteos: '🥛', Otros: '🧺' };
const money = (price: number | string) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(Number(price));
const today = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

export default function App() {
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
    <header className="topbar"><a className="brand" href="#inicio" aria-label="Kiosco Lupita, inicio"><span className="brand-icon">KL</span><span><strong>Kiosco Lupita</strong><small>Precios siempre a mano</small></span></a><nav aria-label="Navegación principal"><a className="nav-link active" href="#precios">Consultar precios</a><a className="nav-link" href="#administrar">Administrar productos</a></nav><div className="open-badge"><span /> API conectada</div></header>
    <main id="inicio">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">KIOSCO DE BARRIO · ATENCIÓN DE CONFIANZA</span><h1>¡Hola! ¿Qué estás<br />buscando hoy?</h1><p>Encontrá rápido lo que necesitás y consultá el precio al instante.</p><a className="hero-button" href="#precios">Ver todos los precios <ArrowDown size={15} /></a></div><div className="hero-art" aria-hidden="true"><div className="sun" /><ShoppingBag className="bag" size={110} strokeWidth={1.1} /><div className="art-note note-one">☀️ <span>algo rico</span></div><div className="art-note note-two"><Heart size={13} /> <span>hecho con cariño</span></div><div className="art-leaf">✳</div></div></section>
      <section className="catalog" id="precios"><div className="section-heading"><div><span className="eyebrow">NUESTRO MOSTRADOR</span><h2>Lista de precios</h2><p className="muted">Todo lo que te gusta, en un solo lugar.</p></div><div className="date-label"><span className="date-icon"><CalendarDays size={16} /></span><span>Precios de hoy<small>{today}</small></span></div></div>
        {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadProducts()}>Reintentar</button></div>}
        <div className="toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar un producto..." aria-label="Buscar producto" /></label><div className="categories" aria-label="Filtrar por categoría">{categories.map((value) => <button type="button" key={value} className={`category-chip ${category === value ? 'selected' : ''}`} onClick={() => setCategory(value)}>{value}</button>)}</div></div>
        <div className="results-line">{loading ? 'Cargando productos…' : `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`}{(query || category !== 'Todos') && <button className="text-button" type="button" onClick={() => { setQuery(''); setCategory('Todos'); }}>Limpiar filtros</button>}</div>
        {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /> Consultando la lista de precios…</div> : filtered.length ? <div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.id}><div className="card-top"><span className="product-emoji">{categoryEmoji[product.categoria] || '🧺'}</span><span className="product-category">{product.categoria}</span></div><h3 className="product-name">{product.nombre}</h3><div className="product-price">{money(product.precio)}</div></article>)}</div> : <div className="empty-state"><span>🔎</span><h3>{products.length ? 'No encontramos ese producto' : 'Todavía no hay productos'}</h3><p>{products.length ? 'Probá con otra búsqueda o elegí una categoría distinta.' : 'Agregá el primer producto desde Administrar productos.'}</p></div>}
        <p className="catalog-note"><Heart size={13} /> ¿No encontraste lo que buscabas? Preguntanos, ¡seguro te ayudamos!</p>
      </section>
      <section className="manage-section" id="administrar"><div className="section-heading"><div><span className="eyebrow">PARA EL MOSTRADOR</span><h2>Administrar productos</h2><p className="muted">Agregá productos nuevos o actualizá sus precios.</p></div><span className="manage-icon"><Pencil size={18} /></span></div>
        <form className="product-form" onSubmit={(event) => void submit(event)}><label>Nombre del producto<input maxLength={120} required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Alfajor de chocolate" /></label><label>Categoría<select required value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })}>{[...new Set([...categories.filter((value) => value !== 'Todos'), 'Bebidas', 'Golosinas', 'Snacks', 'Almacén', 'Lácteos', 'Otros'])].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Precio ($)<input required min="0.01" step="0.01" type="number" value={form.precio || ''} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} placeholder="Ej. 1500" /></label><div className="form-actions">{editing !== null && <button type="button" className="secondary-button" onClick={resetForm}><X size={14} /> Cancelar</button>}<button type="submit" className="primary-button">{editing !== null ? <Check size={15} /> : <Plus size={15} />}{editing !== null ? 'Guardar cambios' : 'Agregar producto'}</button></div><p className="form-note">Los cambios se guardan en la base de datos.</p></form>
        <div className="manage-list-wrap"><div className="manage-list-head"><strong>Productos cargados</strong><span>{products.length} {products.length === 1 ? 'producto' : 'productos'}</span></div><div className="manage-list">{products.length ? products.map((product) => <div className="manage-row" key={product.id}><div className="manage-product"><span className="product-emoji">{categoryEmoji[product.categoria] || '🧺'}</span><span><strong>{product.nombre}</strong><small>{product.categoria}</small></span></div><span className="manage-row-price">{money(product.precio)}</span><span className="row-actions"><button type="button" onClick={() => beginEdit(product)} aria-label={`Editar ${product.nombre}`} title="Editar"><Pencil size={14} /></button><button type="button" onClick={() => void remove(product)} aria-label={`Eliminar ${product.nombre}`} title="Eliminar"><Trash2 size={14} /></button></span></div>) : <div className="list-empty">Todavía no hay productos cargados.</div>}</div></div>
      </section>
    </main>
    <footer><a className="brand footer-brand" href="#inicio"><span className="brand-icon">KL</span><span><strong>Kiosco Lupita</strong><small>Gracias por elegirnos ♡</small></span></a><span>Con cariño, para tu día a día <b>♡</b></span></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </>;
}
