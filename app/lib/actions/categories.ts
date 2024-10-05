// app/lib/actions/categories.ts

// Define the valid user roles
export type UserRole = 'super_administrador' | 'administrador' | 'vendedor' | 'cajero' | 'bodega' | 'cliente' | 'sistemas';

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
    { id: 2, name: "Punto de venta", description: "Ventas, pedidos y transferencias.", link: "/acciones" },
    { id: 3, name: "Cobro de tickets mobiles", description: "Cobra e imprime tickets mobiles.", link: "/ticketManagement" },
    { id: 4, name: "Surtir pedidos mobiles", description: "Revisa y surte tickets mobiles.", link: "/warehouse" },
    { id: 5, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 6, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 7, name: "Documentos", description: "Contratos, recibos y documentos.", link: "/documentos" },
    { id: 8, name: "Registro de moviminetos", description: "Administra el registro de moviminetos.", link: "/stock-movements" },
  ],
  administrador: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Personal", description: "Sueldos, asistencias y permisos.", link: "/personal" },
    { id: 3, name: "Contenedores", description: "Precargar, recibir e historial.", link: "/contenedores" },
    { id: 4, name: "Documentos", description: "Contratos, recibos y documentos de administración.", link: "/documentos" },
    { id: 5, name: "Registro de moviminetos", description: "Administra el registro de moviminetos.", link: "/stock-movements" },
  ],
  vendedor: [
    { id: 1, name: "Punto de venta", description: "Ventas y pedidos", link: "/acciones" },
    { id: 2, name: "Productos", description: "Consulta existencia y ubicaciones.", link: "/productos" },
  ],
  cajero: [
    { id: 1, name: "Cobro de tickets mobiles", description: "Cobra e imprime tickets mobiles.", link: "/ticketManagement" },
    { id: 2, name: "Productos", description: "Consulta existencia y ubicaciones.", link: "/productos" },
  ],
  bodega: [
    { id: 2, name: "Surtir pedidos mobile", description: "Revisa y surte tickets mobiles.", link: "/warehouse" },
    { id: 3, name: "Productos", description: "Consulta existencia y ubicaciones.", link: "/productos" },
  ],
  cliente: [
    { id: 1, name: "Productos", description: "Consulta existencia y ubicaciones.", link: "/productos" },
  ],
  sistemas: [
    { id: 1, name: "Productos", description: "Agregar, modificar, eliminar e inventario.", link: "/productos" },
    { id: 2, name: "Punto de venta", description: "Ventas, pedidos y transferencias.", link: "/acciones" },
    { id: 3, name: "Surtir pedidos mobiles", description: "Revisa y surte tickets mobiles.", link: "/warehouse" },
    { id: 4, name: "Registro de moviminetos", description: "Administra el registro de moviminetos.", link: "/stock-movements" },
  ],
};