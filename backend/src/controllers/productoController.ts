import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Producto } from '../models/Producto';

const parseId = (value: string): number | null => /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
const routeId = (value: string | string[] | undefined): number | null => typeof value === 'string' ? parseId(value) : null;

export async function listarProductos(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';
  const where: Record<string, unknown> = { activo: true };
  if (q) where.nombre = { [Op.iLike]: `%${q}%` };
  if (categoria && categoria !== 'Todos') where.categoria = categoria;
  const productos = await Producto.findAll({ where, order: [['nombre', 'ASC']] });
  res.json({ data: productos });
}

export async function obtenerProducto(req: Request, res: Response): Promise<void> {
  const id = routeId(req.params.id);
  if (!id) { res.status(400).json({ error: 'El identificador no es válido.' }); return; }
  const producto = await Producto.findOne({ where: { id, activo: true } });
  if (!producto) { res.status(404).json({ error: 'No se encontró el producto.' }); return; }
  res.json({ data: producto });
}

function validarBody(body: unknown): { nombre: string; categoria: string; precio: number } | string {
  if (!body || typeof body !== 'object') return 'Ingresá los datos del producto.';
  const input = body as Record<string, unknown>;
  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
  const categoria = typeof input.categoria === 'string' ? input.categoria.trim() : 'Otros';
  const precio = Number(input.precio);
  if (!nombre || nombre.length > 120) return 'El nombre es obligatorio y debe tener hasta 120 caracteres.';
  if (!categoria || categoria.length > 60) return 'La categoría es obligatoria y debe tener hasta 60 caracteres.';
  if (!Number.isFinite(precio) || precio <= 0) return 'El precio debe ser un número mayor que cero.';
  return { nombre, categoria, precio };
}

export async function crearProducto(req: Request, res: Response): Promise<void> {
  const values = validarBody(req.body);
  if (typeof values === 'string') { res.status(400).json({ error: values }); return; }
  const producto = await Producto.create(values);
  res.status(201).json({ data: producto });
}

export async function actualizarProducto(req: Request, res: Response): Promise<void> {
  const id = routeId(req.params.id);
  if (!id) { res.status(400).json({ error: 'El identificador no es válido.' }); return; }
  const values = validarBody(req.body);
  if (typeof values === 'string') { res.status(400).json({ error: values }); return; }
  const producto = await Producto.findOne({ where: { id, activo: true } });
  if (!producto) { res.status(404).json({ error: 'No se encontró el producto.' }); return; }
  await producto.update(values);
  res.json({ data: producto });
}

export async function eliminarProducto(req: Request, res: Response): Promise<void> {
  const id = routeId(req.params.id);
  if (!id) { res.status(400).json({ error: 'El identificador no es válido.' }); return; }
  const producto = await Producto.findOne({ where: { id, activo: true } });
  if (!producto) { res.status(404).json({ error: 'No se encontró el producto.' }); return; }
  await producto.update({ activo: false });
  res.status(204).end();
}
