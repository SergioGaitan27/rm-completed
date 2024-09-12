'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Button,
  Spinner,
  Flex,
  useToast,
} from "@chakra-ui/react";
import ProductSearch from './ProductSearch';
import PedidoDetails from './PedidoDetails';
import PedidoList from './PedidoList';
import { Product, IPedidoList } from '@/app/types/product';

const PedidoProductosPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pedido, setPedido] = useState<IPedidoList>({
    productId: '',
    productName: '',
    productCode: '',
    piecesPerBox: 0,
    imageUrl: '',
    boxCode: '',
    fromLocation: '',
    toLocation: '',
    quantity: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pedidoList, setPedidoList] = useState<IPedidoList[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    };
    fetchProducts();

    const fetchUserLocation = async () => {
      const response = await fetch('/api/user/location');
      const data = await response.json();
      setUserLocation(data.location);
    };
    fetchUserLocation();
  }, []);

  if (status === 'loading') {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setPedido(prev => ({
      ...prev,
      productId: product._id,
      productName: product.name,
      productCode: product.productCode,
      boxCode: product.boxCode,
      imageUrl: product.imageUrl || '',
      quantity: 0,
      toLocation: userLocation
    }));
  };

  const handlepedidoChange = (field: keyof IPedidoList, value: string | number) => {
    setPedido(prev => {
      const newPedido = { ...prev };
      
      if (field === 'quantity') {
        if (value === '') {
          newPedido.quantity = '';
        } else {
          const numValue = Number(value);
          newPedido.quantity = isNaN(numValue) ? 0 : numValue;
        }
      } else {
        (newPedido as any)[field] = value;
      }
      
      if (field === 'quantity' || field === 'fromLocation') {
        const fromLocation = selectedProduct?.stockLocations.find(loc => loc.location === newPedido.fromLocation);
        const availableQuantity = Number(fromLocation?.quantity || 0);
        
        if (typeof newPedido.quantity === 'number' && newPedido.quantity > availableQuantity) {
          newPedido.quantity = availableQuantity;
        }
      }
      
      return newPedido;
    });
  };

  const handleAddToPedidoList = () => {
    const isDuplicate = pedidoList.some(item => 
      item.productId === pedido.productId && 
      item.fromLocation === pedido.fromLocation && 
      item.toLocation === pedido.toLocation
    );
  
    if (isDuplicate) {
      toast({
        title: "Error",
        description: "El producto ya está en la lista con la misma ubicación de origen y destino.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    if (selectedProduct && pedido.fromLocation && pedido.toLocation && 
      (typeof pedido.quantity === 'number' && pedido.quantity > 0)) {
        setPedidoList(prev => [...prev, {
          ...pedido,
          quantity: Number(pedido.quantity),
          piecesPerBox: selectedProduct.piecesPerBox  // Add this line
        }]);
    setSelectedProduct(null);
    setPedido({
      productId: '',
      productName: '',
      productCode: '',
      piecesPerBox: 0,
      imageUrl: '',
      boxCode: '',
      fromLocation: '',
      toLocation: userLocation,
      quantity: '',
    });
  }
};

  const handleRemoveFromPedidoList = (index: number) => {
    setPedidoList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const pedidoData = {
        pedidos: pedidoList,
        isSurtido: false  // Asegúrate de que este campo esté presente
      };
  
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedidoData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Pedido realizado",
        description: "El pedido se ha realizado exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        setPedidoList([]);
        router.push('/pedidos');
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">Pedido de Productos</Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <ProductSearch 
                products={products}
                onProductSelect={handleProductSelect}
              />

              {selectedProduct && (
                <PedidoDetails
                  selectedProduct={selectedProduct}
                  pedido={pedido}
                  onPedidoChange={handlepedidoChange}
                  onAddToPedidoList={handleAddToPedidoList}
                  userLocation={userLocation}
                />
              )}

              {pedidoList.length > 0 && (
                <PedidoList
                  pedidoList={pedidoList}
                  onRemovePedido={handleRemoveFromPedidoList}
                />
              )}

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
                loadingText="Procesando..."
                isDisabled={pedidoList.length === 0}
              >
                Realizar Pedido
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
};

export default PedidoProductosPage;