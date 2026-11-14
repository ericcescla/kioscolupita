export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number | string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductoInput {
  nombre: string;
  categoria: string;
  precio: number;
}
