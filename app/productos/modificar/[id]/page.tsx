'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Container, Heading, VStack, useToast } from "@chakra-ui/react";
import ProductForm from './ProductForm';
import { IProduct } from '@/app/lib/models/Producto';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [product, setProduct] = useState<IProduct | null>(null);
  const toast = useToast();

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener el producto');
      }
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el producto.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [params.id, toast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_administrador') {
      router.push('/productos');
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para modificar productos.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else if (status === 'authenticated') {
      fetchProduct();
    }
  }, [status, session, router, fetchProduct, toast]);

  const handleBack = () => {
    router.push('/productos');
  };

  const handleSubmit = async (updatedProduct: IProduct) => {
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el producto');
      }

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push('/productos');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!product) {
    return <Box>Cargando...</Box>;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1">Modificar Producto</Heading>
          <ProductForm 
            product={product} 
            onSubmit={handleSubmit} 
            onBack={handleBack}
          />
        </VStack>
      </Container>
    </Box>
  );
}