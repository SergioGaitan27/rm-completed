'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  HStack, 
  VStack,
  Text,
  Select, 
  IconButton, 
  Tooltip,
  useToast,
  SimpleGrid,
  useDisclosure
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, RepeatIcon, DownloadIcon } from '@chakra-ui/icons';
import ProductCard from './ProductCard';
import ProductListView from './ProductListView';
import SearchSection from './SearchSection';
import ExportPDFModal from './ExportPDFModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
  
  namespace jsPDF {
    interface Internal {
      getNumberOfPages: () => number;
    }
  }
}

interface StockLocation {
  location: string;
  quantity: number;
}

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  cost: number;
  price1: number;
  price1MinQty: number;
  price2: number;
  price2MinQty: number;
  price3: number;
  price3MinQty: number;
  price4?: number;
  price5?: number;
  stockLocations: StockLocation[];
  imageUrl?: string;
  category: string;
  availability: boolean;
}

type StockStatusType = 'all' | 'inStock' | 'available' | 'unavailable';
type AvailabilityType = 'all' | 'available' | 'unavailable';

const ProductCatalog: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStockStatus, setActiveStockStatus] = useState<StockStatusType>('all');
  const [activeAvailability, setActiveAvailability] = useState<AvailabilityType>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map((product: Product) => product.category))) as string[];
      setCategories(['all', ...uniqueCategories]);

      toast({
        title: "Productos actualizados",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error al actualizar productos",
        description: "Por favor, intenta de nuevo más tarde",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
      setLoading(false);
    }
  }, [toast]);

  const fetchUserLocation = useCallback(async () => {
    try {
      const response = await fetch('/api/user/location');
      if (!response.ok) {
        throw new Error('Error al obtener la ubicación del usuario');
      }
      const data = await response.json();
      setUserLocation(data.location);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error al obtener la ubicación",
        description: "No se pudo obtener tu ubicación",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
      fetchUserLocation();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, fetchProducts, fetchUserLocation, router]);

  const getProductStatus = useCallback((product: Product, userLocation: string): StockStatusType => {
    const totalStock = product.stockLocations.reduce((sum, location) => sum + location.quantity, 0);
    const stockInUserLocation = product.stockLocations.find(loc => loc.location === userLocation)?.quantity || 0;

    if (stockInUserLocation > 0) {
      return 'inStock';
    } else if (totalStock > 0) {
      return 'available';
    } else {
      return 'unavailable';
    }
  }, []);

  const filterProducts = useMemo(() => {
    return () => {
      const filtered = products.filter(product => {
        const matchesSearch = 
          product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase());

        const status = getProductStatus(product, userLocation);

        const matchesCategory = 
          activeCategory === 'all' || 
          product.category === activeCategory;

        const matchesAvailability = 
          activeAvailability === 'all' || 
          (activeAvailability === 'available' && product.availability) ||
          (activeAvailability === 'unavailable' && !product.availability);

        const matchesStockStatus = 
          activeStockStatus === 'all' || 
          status === activeStockStatus;

        return matchesSearch && matchesCategory && matchesAvailability && matchesStockStatus;
      });
      setFilteredProducts(filtered);
    };
  }, [searchTerm, products, activeCategory, activeAvailability, activeStockStatus, userLocation, getProductStatus]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const exportToPDF = useCallback(async (withImages: boolean) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFontSize(18);
    doc.text('Catálogo de Productos', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
    const tableData = filteredProducts.map(product => [
      product.name,
      product.boxCode,
      product.productCode,
      product.category,
      product.availability ? 'Disponible' : 'No disponible',
      `$${product.cost}`,
      `$${product.price1} (Min: ${product.price1MinQty})`,
      `$${product.price2} (Min: ${product.price2MinQty})`,
      `$${product.price3} (Min: ${product.price3MinQty})`,
      product.stockLocations.map(loc => `${loc.location}: ${loc.quantity}`).join('\n')
    ]);
  
    doc.autoTable({
      head: [['Nombre', 'Código de caja', 'Código de producto', 'Categoría', 'Disponibilidad', 'Costo', 'Precio 1', 'Precio 2', 'Precio 3', 'Inventario']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 23 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
        8: { cellWidth: 30 },
        9: { cellWidth: 25 }
      },
      didDrawPage: function (data: any) {
        doc.setFontSize(10);
        const pageNumber = (doc.internal as any).getNumberOfPages();
        doc.text('Página ' + pageNumber, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
  
    const now = new Date();
    const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    
    // Formatear la fecha y hora manualmente
    const year = mexicoTime.getFullYear();
    const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
    const day = String(mexicoTime.getDate()).padStart(2, '0');
    const hours = String(mexicoTime.getHours()).padStart(2, '0');
    const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
    const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}-(${hours};${minutes};${seconds})`;
    const filename = `catalogo_productos_${formattedDate}.pdf`;
  
    doc.save(filename);
    
    toast({
      title: "PDF Exportado",
      description: `El catálogo ha sido guardado como ${filename}`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  }, [filteredProducts, toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = e.target.value.toUpperCase();
    setSearchTerm(upperCaseValue);
    e.target.value = upperCaseValue; // Esto actualiza el valor del input directamente
  };

  const handleSearch = useCallback(() => {
    if (searchTerm.trim() === 'CREAR' || searchTerm.trim() === 'NUEVO') {
      router.push('/productos/crear');
      return;
    }

    if (searchTerm.trim().toUpperCase() === 'ACTUALIZAR') {
      fetchProducts();
      setSearchTerm('');
      return;
    }
    filterProducts();
  }, [searchTerm, router, fetchProducts, filterProducts]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  }, []);

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  const userRole = session?.user?.role || ''; 

  return (
    <VStack spacing={6} align="stretch">
      <SearchSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        isUpdating={isUpdating}
      />
      <HStack spacing={4} justifyContent="space-between" alignItems="flex-end">
        <HStack spacing={4}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold">Filtrar por categoría:</Text>
            <Select 
              value={activeCategory} 
              onChange={(e) => setActiveCategory(e.target.value)}
              size="sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas las categorías' : category}
                </option>
              ))}
            </Select>
          </VStack>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold">Filtrar por existencia:</Text>
            <Select 
              value={activeStockStatus} 
              onChange={(e) => setActiveStockStatus(e.target.value as StockStatusType)}
              size="sm"
            >
              <option value="all">Todos</option>
              <option value="inStock">Con existencia en tu ubicación</option>
              <option value="available">Existencia en otras ubicaciones</option>
              <option value="unavailable">Sin existencia</option>
            </Select>
          </VStack>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold">Filtrar por disponibilidad:</Text>
            <Select 
              value={activeAvailability} 
              onChange={(e) => setActiveAvailability(e.target.value as AvailabilityType)}
              size="sm"
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No Disponibles</option>
            </Select>
          </VStack>
        </HStack>
        <HStack spacing={4}>
          <Tooltip label="Actualizar productos" placement="top">
            <IconButton
              aria-label="Actualizar productos"
              icon={<RepeatIcon />}
              onClick={fetchProducts}
              isLoading={isUpdating}
            />
          </Tooltip>
          <Tooltip label={`Cambiar a vista de ${viewMode === 'grid' ? 'lista' : 'cuadrícula'}`} placement="top">
            <IconButton
              aria-label={`Cambiar a vista de ${viewMode === 'grid' ? 'lista' : 'cuadrícula'}`}
              icon={viewMode === 'grid' ? <ViewIcon /> : <ViewOffIcon />}
              onClick={toggleViewMode}
            />
          </Tooltip>
          <Tooltip label="Exportar a PDF" placement="top">
            <IconButton
              aria-label="Exportar a PDF"
              icon={<DownloadIcon />}
              onClick={onOpen}
            />
          </Tooltip>
        </HStack>
      </HStack>
      {viewMode === 'grid' ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} userLocation={userLocation} userRole={userRole} />
          ))}
        </SimpleGrid>
      ) : (
        <ProductListView products={filteredProducts} userLocation={userLocation} userRole={userRole} />
      )}
      <ExportPDFModal
        isOpen={isOpen}
        onClose={onClose}
        onExport={exportToPDF}
      />
    </VStack>
  );
};

export default ProductCatalog;