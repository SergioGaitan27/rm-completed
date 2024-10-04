import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';

interface FiltersProps {
  onFilter: (filters: any) => void;
}

interface Product {
  _id: string;
  name: string;
}

const TIMEZONE = 'America/Mexico_City';

const Filters: React.FC<FiltersProps> = ({ onFilter }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterValues, setFilterValues] = useState({
    productId: '',
    location: '',
    movementType: '',
    startDate: moment().tz(TIMEZONE).startOf('day').format('YYYY-MM-DD'),
    endDate: moment().tz(TIMEZONE).format('YYYY-MM-DD'),
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/products');
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    // Aplicar los filtros iniciales (para mostrar los movimientos de hoy por defecto)
    handleSubmit();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const adjustedFilters = {
      ...filterValues,
      startDate: moment(filterValues.startDate).tz(TIMEZONE).startOf('day').toISOString(),
      endDate: moment(filterValues.endDate).tz(TIMEZONE).endOf('day').toISOString(),
    };
    onFilter(adjustedFilters);
  };

  const handleReset = () => {
    const today = moment().tz(TIMEZONE);
    const resetValues = {
      productId: '',
      location: '',
      movementType: '',
      startDate: today.format('YYYY-MM-DD'),
      endDate: today.format('YYYY-MM-DD'),
    };
    setFilterValues(resetValues);
    onFilter({
      ...resetValues,
      startDate: today.startOf('day').toISOString(),
      endDate: today.endOf('day').toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
      <div className="flex flex-wrap -mx-2">
        {/* Producto */}
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
            Producto
          </label>
          <select
            name="productId"
            id="productId"
            value={filterValues.productId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            disabled={isLoading}
          >
            <option value="">Todos</option>
            {products && products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
          {isLoading && <p className="mt-1 text-sm text-gray-500">Cargando productos...</p>}
        </div>
        {/* Ubicación */}
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Ubicación
          </label>
          <input
            type="text"
            name="location"
            id="location"
            value={filterValues.location}
            onChange={handleChange}
            placeholder="Ej. B161"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Tipo de Movimiento */}
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
          <label htmlFor="movementType" className="block text-sm font-medium text-gray-700">
            Tipo de Movimiento
          </label>
          <select
            name="movementType"
            id="movementType"
            value={filterValues.movementType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Todos</option>
            <option value="sale">Venta</option>
            <option value="restock">Reposición</option>
            <option value="return">Devolución</option>
            <option value="adjustment">Ajuste</option>
          </select>
        </div>
        {/* Fecha de Inicio */}
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Fecha de Inicio
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            value={filterValues.startDate}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Fecha de Fin */}
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Fecha de Fin
          </label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            value={filterValues.endDate}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>
      {/* Botones */}
      <div className="flex items-center justify-end mt-4">
        <button
          type="button"
          onClick={handleReset}
          className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Resetear
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
};

export default Filters;