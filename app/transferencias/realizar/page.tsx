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
import EvidenceImage from './EvidenceImage';
import { Product, ITransfer } from '@/app/types/product';

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
    imageUrl: '',
    boxCode: '',
    fromLocation: '',
    toLocation: '',
    quantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transferList, setTransferList] = useState<ITransfer[]>([]);
  const [transferImage, setTransferImage] = useState<File | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    };
    fetchProducts();
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
      quantity: 0
    }));
  };

  const handleTransferChange = (field: keyof ITransfer, value: string | number) => {
    setTransfer(prev => {
      const newTransfer = { ...prev };

      if (field === 'quantity') {
        // Convertir el valor a número si es una cadena
        newTransfer.quantity = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
      } else {
        (newTransfer as any)[field] = value;
      }

      if (field === 'quantity' || field === 'fromLocation') {
        const fromLocation = selectedProduct?.stockLocations.find(loc => loc.location === newTransfer.fromLocation);
        const availableQuantity = typeof fromLocation?.quantity === 'string' 
          ? parseInt(fromLocation.quantity, 10) 
          : (fromLocation?.quantity || 0);

        if (newTransfer.quantity > availableQuantity) {
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

    if (selectedProduct && transfer.fromLocation && transfer.toLocation && transfer.quantity > 0) {
      setTransferList(prev => [...prev, transfer]);
      setSelectedProduct(null);
      setTransfer({
        productId: '',
        productName: '',
        productCode: '',
        imageUrl: '',
        boxCode: '',
        fromLocation: '',
        toLocation: '',
        quantity: 0
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
      let imageUrl = '';
      if (transferImage) {
        const formData = new FormData();
        formData.append('file', transferImage);
        formData.append('upload_preset', 'xgmwzgac');

        const imageResponse = await fetch('https://api.cloudinary.com/v1_1/dpsrtoyp7/image/upload', {
          method: 'POST',
          body: formData
        });

        if (!imageResponse.ok) {
          throw new Error('Error al subir la imagen de evidencia');
        }

        const imageData = await imageResponse.json();
        imageUrl = imageData.secure_url;
      }

      const transferData = {
        transfers: transferList,
        evidenceImageUrl: imageUrl
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
      const pdfBase64 = responseData.pdfUrl.split(',')[1];

      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const pdfUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', 'TransferenciaProductos.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Transferencias realizadas",
        description: "Las transferencias se han realizado exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        setTransferList([]);
        setTransferImage(null);
        router.push('/transferencias');
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
          <Heading as="h1" size="xl" textAlign="center">Transferencia de Productos</Heading>
          
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
                />
              )}

              {transferList.length > 0 && (
                <TransferList
                  transferList={transferList}
                  onRemoveTransfer={handleRemoveFromTransferList}
                />
              )}

              <EvidenceImage
                transferImage={transferImage}
                onImageChange={setTransferImage}
              />

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
                loadingText="Procesando..."
                isDisabled={transferList.length === 0 || !transferImage}
              >
                Realizar Transferencias
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
};

export default TransferenciaProductosPage;