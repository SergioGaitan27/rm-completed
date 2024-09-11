'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Divider,
  useToast,
} from "@chakra-ui/react";

interface ITransferItem {
  productId: string;
  productName: string;
  productCode: string;
  boxCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
}

interface ITransfer {
  _id: string;
  transfers: ITransferItem[];
  evidenceImageUrl: string;
  date: string;
}

const TransferenciaDetallePage = ({ params }: { params: { transferNumber: string } }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [transfer, setTransfer] = useState<ITransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransferDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/transfers/${params.transferNumber}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transfer details');
      }
      const data = await response.json();
      setTransfer(data);
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar los detalles de la transferencia',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.transferNumber, toast]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransferDetails();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchTransferDetails]);

  if (status === 'loading' || isLoading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) return null;
  if (!transfer) return <Text>No se encontró la transferencia</Text>;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">Detalles de Transferencia</Heading>
          
          <Card>
            <CardBody>
              <Heading as="h2" size="lg" mb={4}>Información General</Heading>
              <Stack spacing={2}>
                <Text><strong>ID de Transferencia:</strong> {transfer._id}</Text>
                <Text><strong>Fecha:</strong> {new Date(transfer.date).toLocaleString()}</Text>
                <Text><strong>Total de Productos:</strong> {transfer.transfers.length}</Text>
                <Text><strong>Total de Unidades:</strong> {transfer.transfers.reduce((acc, t) => acc + t.quantity, 0)}</Text>
              </Stack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading as="h2" size="lg" mb={4}>Productos Transferidos</Heading>
              <VStack spacing={4} align="stretch">
                {transfer.transfers.map((item, index) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <Heading as="h3" size="md" mb={2}>{item.productName}</Heading>
                    <SimpleGrid columns={[1, 2]} spacing={2}>
                      <Text><strong>Código de Producto:</strong> {item.productCode}</Text>
                      <Text><strong>Código de Caja:</strong> {item.boxCode}</Text>
                      <Text><strong>Desde:</strong> {item.fromLocation}</Text>
                      <Text><strong>Hacia:</strong> {item.toLocation}</Text>
                      <Text><strong>Cantidad:</strong> {item.quantity}</Text>
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {transfer.evidenceImageUrl && (
            <Card>
              <CardBody>
                <Heading as="h2" size="lg" mb={4}>Evidencia</Heading>
                <Box position="relative" height="300px">
                  <Image
                    src={transfer.evidenceImageUrl}
                    alt="Evidencia de transferencia"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </CardBody>
            </Card>
          )}

          <Button 
            onClick={() => router.back()} 
            colorScheme="blue"
            size="lg"
          >
            Volver al Historial
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default TransferenciaDetallePage;