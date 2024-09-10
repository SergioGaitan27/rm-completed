// app/productos/page.tsx
import { Suspense } from 'react';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Box, Container, Heading, Text, Flex, VStack } from "@chakra-ui/react";
import ProductCatalog from './ProductCatalog';
import CatalogoLoading from './loading';
import { getAuthOptions } from "@/app/lib/actions/auth";
import LogoutButton from "../categorias/LogoutButton";

export default async function CatalogoPage() {
  const session = await getServerSession(getAuthOptions());

  if (!session) {
    redirect("/login");
  }

  const userName = session.user?.name;
  const userRole = session.user?.role;
  const userLocation = session.user?.location;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <Flex justifyContent="space-between" flexDirection={['column', 'column', 'row']} alignItems="center" mb={8}>
          <VStack align="start" spacing={4} mb={[4, 4, 0]}>
            <Heading as="h1">Administración de Productos</Heading>
            <VStack align="start" spacing={1}>
              <Text>Bienvenido, {userName}.</Text>
              <Text color="gray.600">Rol: {userRole}</Text>
              <Text color="gray.600">Ubicación Actual: {userLocation}</Text>
            </VStack>
          </VStack>
          <LogoutButton />
        </Flex>
        <Suspense fallback={<CatalogoLoading />}>
          <ProductCatalog />
        </Suspense>
      </Container>
    </Box>
  );
}