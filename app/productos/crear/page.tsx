'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Container, Heading, VStack, useToast } from "@chakra-ui/react";
import CreateProductForm from './CreateProductForm';
import { IProductBase } from '@/app/types/product';

const CreateProductPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (productData: IProductBase) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }

      const savedProduct = await response.json();
      console.log('Producto guardado:', savedProduct);

      toast({
        title: "Éxito",
        description: "Producto creado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push('/productos');
    } catch (error) {
      console.error('Error al crear el producto:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/productos');
  };

  if (status === 'loading' || isLoading) {
    return <Box>Cargando...</Box>;
  }
  
  if (!session) {
    return null;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1">Crear Producto</Heading>
          <CreateProductForm 
            onSubmit={handleSubmit} 
            onBack={handleBack}
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default CreateProductPage;