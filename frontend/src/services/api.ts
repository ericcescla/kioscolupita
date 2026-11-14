import axios from 'axios';
import type { Producto, ProductoInput } from '../types/producto';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api', headers: { 'Content-Type': 'application/json' } });
export const productoService = {
  async listar(params?: { q?: string; categoria?: string }): Promise<Producto[]> {
    const { data } = await api.get<{ data: Producto[] }>('/productos', { params });
    return data.data;
  },
  async crear(input: ProductoInput): Promise<Producto> {
    const { data } = await api.post<{ data: Producto }>('/productos', input);
    return data.data;
  },
  async actualizar(id: number, input: ProductoInput): Promise<Producto> {
    const { data } = await api.put<{ data: Producto }>(`/productos/${id}`, input);
    return data.data;
  },
  async eliminar(id: number): Promise<void> { await api.delete(`/productos/${id}`); },
};

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error)) return error.response?.data?.error || 'No se pudo conectar con la API. Revisá que el backend y la base estén disponibles.';
  return 'Ocurrió un error inesperado.';
}
