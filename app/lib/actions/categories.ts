// app/lib/actions/categories.ts

// Define the valid user roles
export type UserRole = 'super_administrador' | 'administrador' | 'vendedor' | 'cliente' | 'sistemas';

// Define the structure of a category
export interface Category {
  id: number;
  name: string;
  description: string;
  link: string;
}

// Define the categories for each role
export const roleCategories: Record<UserRole, Category[]> = {
  super_administrador: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Acciones", description: "Ventas, pedidos y transferencias.", link: "/acciones" },
    { id: 3, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 4, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 5, name: "Documentos", description: "Contratos, recibos y documentos.", link: "/documentos" },
  ],
  administrador: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 3, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 4, name: "Documentos", description: "Contratos, recibos y documentos de administración.", link: "/documentos" },
  ],
  vendedor: [

    { id: 1, name: "Acciones", description: "Ventas, pedidos y transferencias.", link: "/acciones" },
    { id: 2, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
  ],
  cliente: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 3, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 4, name: "Documentos", description: "Contratos, recibos y documentos de administración.", link: "/documentos" },
  ],
  sistemas: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 3, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 4, name: "Documentos", description: "Contratos, recibos y documentos de administración.", link: "/documentos" },
  ],
};