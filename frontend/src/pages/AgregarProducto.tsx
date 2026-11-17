import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, LoaderCircle, Pencil, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { errorMessage, productoService } from '../services/api';
import type { Producto, ProductoInput } from '../types/producto';

const money = (price: number | string) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(Number(price));

export default function AgregarProducto() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<ProductoInput>({ nombre: '', categoria: 'Bebidas', precio: 0 });

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
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => [...new Set(products.map((product) => product.categoria))], [products]);
  const resetForm = () => {
    setForm({ nombre: '', categoria: categories[0] || 'Bebidas', precio: 0 });
    setEditing(null);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editing !== null) await productoService.actualizar(editing, form);
      else await productoService.crear(form);
      await loadProducts();
      resetForm();
      setToast(editing !== null ? 'Producto actualizado.' : 'Producto agregado.');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  function beginEdit(product: Producto) {
    setEditing(product.id);
    setForm({ nombre: product.nombre, categoria: product.categoria, precio: Number(product.precio) });
    document.querySelector('#administrar')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function remove(product: Producto) {
    if (!window.confirm(`¿Eliminar ${product.nombre} de la lista?`)) return;
    try {
      await productoService.eliminar(product.id);
      await loadProducts();
      setToast('Producto eliminado.');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  const categoryOptions = [...new Set([...categories, 'Bebidas', 'Golosinas', 'Snacks', 'Almacén', 'Lácteos', 'Otros'])];

  return <main className="page add-page">
    {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadProducts()}>Reintentar</button></div>}
    <section className="add-section" id="administrar">
      <h1>agregar producto</h1>
      <form className="product-form" onSubmit={(event) => void submit(event)}>
        <label>nombre<input maxLength={120} required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="alfajor de chocolate" /></label>
        <label>categoría<select required value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })}>{categoryOptions.map((value) => <option key={value} value={value}>{value.toLocaleLowerCase('es')}</option>)}</select></label>
        <label>precio<input required min="0.01" step="0.01" type="number" value={form.precio || ''} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} placeholder="ej. 1500" /></label>
        <div className="form-actions">
          {editing !== null && <button type="button" className="secondary-button" onClick={resetForm}><X size={15} /> cancelar</button>}
          <button type="submit" className="primary-button">{editing !== null ? <Check size={17} /> : <Plus size={19} />}{editing !== null ? 'guardar cambios' : 'agregar producto'}</button>
        </div>
      </form>
    </section>
    <section className="manage-list-wrap" aria-label="Productos cargados">
      <div className="manage-list-head"><strong>Productos cargados</strong><span>{products.length} {products.length === 1 ? 'producto' : 'productos'}</span></div>
      <div className="manage-list">
        {loading ? <div className="list-empty"><LoaderCircle className="spinner" size={17} /> Cargando productos…</div>
          : products.length ? products.map((product) => <div className="manage-row" key={product.id}>
            <div className="manage-product"><span className="product-emoji"><ShoppingCart size={15} /></span><span><strong>{product.nombre}</strong><small>{product.categoria}</small></span></div>
            <span className="manage-row-price">{money(product.precio)}</span>
            <span className="row-actions">
              <button type="button" onClick={() => beginEdit(product)} aria-label={`Editar ${product.nombre}`} title="Editar"><Pencil size={16} /></button>
              <button type="button" onClick={() => void remove(product)} aria-label={`Eliminar ${product.nombre}`} title="Eliminar"><Trash2 size={16} /></button>
            </span>
          </div>)
            : <div className="list-empty">Todavía no hay productos cargados.</div>}
      </div>
    </section>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

