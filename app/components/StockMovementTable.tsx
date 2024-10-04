// app/components/StockMovementTable.tsx

import React from 'react';

interface Product {
  _id: string;
  name: string;
}

interface StockMovement {
  _id: string;
  productId: Product;
  quantityChange: number;
  location: string;
  movementType: string;
  ticketId?: string;
  date: string;
  performedBy?: string;
}

interface StockMovementTableProps {
  stockMovements: StockMovement[];
}

const StockMovementTable: React.FC<StockMovementTableProps> = ({ stockMovements }) => {
  return (  
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
        <thead>
          <tr>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Producto
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Tipo de Movimiento
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ticket ID
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Fecha
            </th>
            <th className="py-3 px-4 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Realizado Por
            </th>
          </tr>
        </thead>
        <tbody>
          {stockMovements.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                No hay movimientos de stock para mostrar.
              </td>
            </tr>
          ) : (
            stockMovements.map((movement) => (
              <tr key={movement._id} className="border-t">
                <td className="py-2 px-4">{movement.productId.name}</td>
                <td
                  className={`py-2 px-4 ${
                    movement.quantityChange < 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {movement.quantityChange < 0
                    ? `${movement.quantityChange}`
                    : `+${movement.quantityChange}`}
                </td>
                <td className="py-2 px-4">{movement.location}</td>
                <td className="py-2 px-4 capitalize">{movement.movementType}</td>
                <td className="py-2 px-4">{movement.ticketId || '-'}</td>
                <td className="py-2 px-4">
                  {new Date(movement.date).toLocaleString()}
                </td>
                <td className="py-2 px-4">{movement.performedBy || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockMovementTable;
