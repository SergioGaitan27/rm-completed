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
import TransferDetails from './TransferDetails';
import TransferList from './TransferList';
import { Product, ITransfer, IStockLocation } from '@/app/types/product';

const TransferenciaProductosPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transfer, setTransfer] = useState<ITransfer>({
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
  const [transferList, setTransferList] = useState<ITransfer[]>([]);
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
    setTransfer(prev => ({
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

  const handleTransferChange = (field: keyof ITransfer, value: string | number) => {
    setTransfer(prev => {
      const newTransfer = { ...prev };
      
      if (field === 'quantity') {
        if (value === '') {
          newTransfer.quantity = '';
        } else {
          const numValue = Number(value);
          newTransfer.quantity = isNaN(numValue) ? 0 : numValue;
        }
      } else {
        (newTransfer as any)[field] = value;
      }
      
      if (field === 'quantity' || field === 'fromLocation') {
        const fromLocation = selectedProduct?.stockLocations.find(loc => loc.location === newTransfer.fromLocation);
        const availableQuantity = Number(fromLocation?.quantity || 0);
        
        if (typeof newTransfer.quantity === 'number' && newTransfer.quantity > availableQuantity) {
          newTransfer.quantity = availableQuantity;
        }
      }
      
      return newTransfer;
    });
  };

  const handleAddToTransferList = () => {
    const isDuplicate = transferList.some(item => 
      item.productId === transfer.productId && 
      item.fromLocation === transfer.fromLocation && 
      item.toLocation === transfer.toLocation
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
  
    if (selectedProduct && transfer.fromLocation && transfer.toLocation && 
      (typeof transfer.quantity === 'number' && transfer.quantity > 0)) {
        setTransferList(prev => [...prev, {
          ...transfer,
          quantity: Number(transfer.quantity),
          piecesPerBox: selectedProduct.piecesPerBox  // Add this line
        }]);
    setSelectedProduct(null);
    setTransfer({
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

  const handleRemoveFromTransferList = (index: number) => {
    setTransferList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transferData = {
        transfers: transferList,
      };

      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      toast({
        title: "Transferencias realizadas",
        description: "Las transferencias se han realizado exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        setTransferList([]);
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
                <TransferDetails
                  selectedProduct={selectedProduct}
                  transfer={transfer}
                  onTransferChange={handleTransferChange}
                  onAddToTransferList={handleAddToTransferList}
                  userLocation={userLocation}
                />
              )}

              {transferList.length > 0 && (
                <TransferList
                  transferList={transferList}
                  onRemoveTransfer={handleRemoveFromTransferList}
                />
              )}

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
                loadingText="Procesando..."
                isDisabled={transferList.length === 0}
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

export default TransferenciaProductosPage;