'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  VStack,
  SimpleGrid,
  Button,
  Text,
  Flex,
  Spinner,
  useToast,
} from "@chakra-ui/react";

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

type TransferenciaCategory = {
  name: string;
  path: string;
  icon: string;
};

const AdminTransferenciasPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Simulando una llamada a API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCategories([
          { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
          { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
          { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
          { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
          { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías. Por favor, intenta de nuevo.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCategories();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, toast]);

  if (status === 'loading' || loading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  const transferenciasCategories: TransferenciaCategory[] = [
    { name: 'Realizar pedido', path: '/pedidos/realizar', icon: '↔️' },
    { name: 'Historial de mis pedidos', path: '/pedidos/historial', icon: '🗄️' },
  ];

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" textAlign="center">Administración de Pedidos</Heading>
          
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <SimpleGrid columns={[1, 2]} spacing={6}>
              {transferenciasCategories.map((category, index) => (
                <Link href={category.path} key={index} passHref>
                  <Button
                    as="a"
                    height="auto"
                    py={4}
                    flexDirection="column"
                    whiteSpace="normal"
                    textAlign="center"
                    bg="gray.100"
                    _hover={{ bg: "gray.200" }}
                    width="100%"
                  >
                    <Text fontSize="3xl" mb={2}>{category.icon}</Text>
                    <Text>{category.name}</Text>
                  </Button>
                </Link>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminTransferenciasPage;