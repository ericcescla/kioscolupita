import { Router } from 'express';
import { actualizarProducto, crearProducto, eliminarProducto, listarProductos, obtenerProducto } from '../controllers/productoController';

export const productoRoutes = Router();
productoRoutes.get('/', listarProductos);
productoRoutes.get('/:id', obtenerProducto);
productoRoutes.post('/', crearProducto);
productoRoutes.put('/:id', actualizarProducto);
productoRoutes.delete('/:id', eliminarProducto);
