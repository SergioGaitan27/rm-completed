'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  VStack,
  SimpleGrid,
  Button,
  Text,
} from "@chakra-ui/react";
import { PedidoCategory } from '@/app/types/product';



const AdminPedidosPage: React.FC = () => {
  const { data: session, status } = useSession();

  if (!session) {
    return null;
  }

  const transferenciasCategories: PedidoCategory[] = [
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

export default AdminPedidosPage;