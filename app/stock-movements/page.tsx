'use client';

import React, { useState } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import StockMovementTable from '@/app/components/StockMovementTable';
import Filters from '@/app/components/Filters';
import ReactPaginate from 'react-paginate';

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

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StockMovementsResponse {
  data: StockMovement[];
  meta: Meta;
}

const fetchStockMovements = async (
  filters: any,
  page: number,
  limit: number
): Promise<StockMovementsResponse> => {
  const response = await axios.get('/api/stockMovements', {
    params: { ...filters, page, limit },
  });
  return response.data;
};

const StockMovementsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    productId: '',
    location: '',
    movementType: '',
    startDate: '',
    endDate: '',
  });

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error }: UseQueryResult<StockMovementsResponse, Error> = useQuery({
    queryKey: ['stockMovements', filters, page],
    queryFn: () => fetchStockMovements(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Resetear a la primera página al aplicar nuevos filtros
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected + 1);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Movimientos de Stock</h1>
      <Filters onFilter={handleFilter} />
      {isLoading ? (
        <p className="mt-4">Cargando movimientos de stock...</p>
      ) : isError ? (
        <p className="mt-4 text-red-500">Error: {error.message}</p>
      ) : (
        <>
          <StockMovementTable stockMovements={data?.data || []} />
          {/* Paginación */}
          <div className="flex justify-center mt-6">
            <ReactPaginate
              previousLabel={'Anterior'}
              nextLabel={'Siguiente'}
              breakLabel={'...'}
              breakClassName={'break-me'}
              pageCount={data?.meta.totalPages || 0}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={'pagination'}
              activeClassName={'active'}
              forcePage={page - 1}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default StockMovementsPage;