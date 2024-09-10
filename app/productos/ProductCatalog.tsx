'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, SimpleGrid, VStack, HStack, Input, Button, Select, useToast, Text } from "@chakra-ui/react";
import ProductCard from './ProductCard';

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

const ProductCatalog: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'inStock' | 'available' | 'unavailable'>('all');
  const [activeAvailability, setActiveAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
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
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
      fetchUserLocation();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, fetchProducts, fetchUserLocation, router]);

  const filterProducts = useCallback(() => {
    const filtered = products.filter(product => {
      const matchesSearch = 
        product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());

      const status = getProductStatus(product, userLocation);

      const matchesCategory = 
        activeCategory === 'all' || 
        (activeCategory === 'inStock' && status === 'inStock') ||
        (activeCategory === 'available' && status === 'available') ||
        (activeCategory === 'unavailable' && status === 'unavailable');

      const matchesAvailability = 
        activeAvailability === 'all' || 
        (activeAvailability === 'available' && product.availability) ||
        (activeAvailability === 'unavailable' && !product.availability);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products, activeCategory, activeAvailability, userLocation]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toUpperCase());
  };

  const handleSearch = () => {
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
  };

  const getProductStatus = (product: Product, userLocation: string): 'inStock' | 'available' | 'unavailable' => {
    const totalStock = product.stockLocations.reduce((sum, location) => sum + location.quantity, 0);
    const stockInUserLocation = product.stockLocations.find(loc => loc.location === userLocation)?.quantity || 0;

    if (stockInUserLocation > 0) {
      return 'inStock';
    } else if (totalStock > 0) {
      return 'available';
    } else {
      return 'unavailable';
    }
  };

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  const userRole = session?.user?.role || ''; 

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <HStack spacing={4}>
        <Input
            placeholder="Buscar por código o nombre"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {/* <Button
            onClick={handleSearch}
            isLoading={isUpdating}
            loadingText="Actualizando"
            colorScheme="blue"
          >
            Buscar
          </Button> */}
        </HStack>
      </Box>
      <Box>
        <HStack spacing={4}>
          <Select 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value as 'all' | 'inStock' | 'available' | 'unavailable')}
          >
            <option value="all">Todos</option>
            <option value="inStock">Con existencia en tu ubicación</option>
            <option value="available">Con existencia en otras ubicaciones</option>
            <option value="unavailable">Sin existencia</option>
          </Select>
          <Select 
            value={activeAvailability} 
            onChange={(e) => setActiveAvailability(e.target.value as 'all' | 'available' | 'unavailable')}
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No Disponibles</option>
          </Select>
        </HStack>
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
        {filteredProducts.map((product) => (
          <ProductCard key={product._id} product={product} userLocation={userLocation} userRole={userRole} />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default ProductCatalog;
