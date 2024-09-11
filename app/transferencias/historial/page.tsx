'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  Flex,
  Spinner,
  useDisclosure,
  Collapse,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  useToast,
} from "@chakra-ui/react";

interface ITransfer {
  _id: string;
  transfers: Array<{
    productId: string;
    productName: string;
    productCode: string;
    boxCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
  }>;
  evidenceImageUrl: string;
  date: string;
}

const HistorialTransferenciasPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isFiltersOpen, onToggle: toggleFilters } = useDisclosure();

  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<ITransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  useEffect(() => {
    const initialize = async () => {
      if (status === 'authenticated') {
        try {
          await fetchTransfers();
        } catch (error) {
          console.error('Error initializing data:', error);
          toast({
            title: "Error",
            description: "Error al cargar los datos",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    initialize();
  }, [status, router, toast]);

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers');
      if (!response.ok) throw new Error('Error al obtener las transferencias');
      const data = await response.json();
      setTransfers(data);
      setFilteredTransfers(data);
    } catch (error) {
      console.error('Error al cargar las transferencias:', error);
      throw new Error('Error al cargar el historial de transferencias');
    }
  };

  const filterTransfers = useCallback(() => {
    let filtered = transfers;

    if (startDate || endDate) {
      filtered = filtered.filter(transfer => {
        const transferDate = new Date(transfer.date);
        transferDate.setHours(0, 0, 0, 0);

        let isInRange = true;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          isInRange = isInRange && transferDate >= start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          isInRange = isInRange && transferDate <= end;
        }

        return isInRange;
      });
    }

    if (destinationFilter) {
      filtered = filtered.filter(transfer => 
        transfer.transfers.some(t => 
          t.toLocation.toLowerCase().includes(destinationFilter.toLowerCase()) ||
          t.fromLocation.toLowerCase().includes(destinationFilter.toLowerCase())
        )
      );
    }

    setFilteredTransfers(filtered);
  }, [transfers, startDate, endDate, destinationFilter]);

  useEffect(() => {
    filterTransfers();
  }, [filterTransfers]);

  if (status === 'loading' || isLoading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) return null;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">Historial de Transferencias</Heading>
          
          <Button onClick={toggleFilters} colorScheme="blue">
            {isFiltersOpen ? 'Ocultar filtros' : 'Filtrar productos'}
          </Button>

          <Collapse in={isFiltersOpen} animateOpacity>
            <SimpleGrid columns={[1, null, 3]} spacing={4} bg="white" p={4} borderRadius="md" boxShadow="md">
              <Box>
                <Text mb={2}>Fecha inicial:</Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2}>Fecha final:</Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2}>Origen o destino:</Text>
                <Input
                  placeholder="Filtrar por origen o destino"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                />
              </Box>
            </SimpleGrid>
          </Collapse>

          {filteredTransfers.length === 0 ? (
            <Text>No hay transferencias en el historial que coincidan con los filtros.</Text>
          ) : (
            <SimpleGrid columns={[1, null, 2]} spacing={6}>
              {filteredTransfers.map((transfer) => {
                const transferDate = new Date(transfer.date);
                const origenDestino = transfer.transfers.map(t => `${t.fromLocation} → ${t.toLocation}`);
                const uniqueOrigenDestino = Array.from(new Set(origenDestino));
                return (
                  <Card key={transfer._id}>
                    <CardBody>
                      <Stack spacing={3}>
                        <Text><strong>Fecha:</strong> {transferDate.toLocaleDateString()}</Text>
                        <Text><strong>Hora:</strong> {transferDate.toLocaleTimeString()}</Text>
                        <Text><strong>Total de productos:</strong> {transfer.transfers.length}</Text>
                        <Text><strong>Total de unidades:</strong> {transfer.transfers.reduce((acc, t) => acc + t.quantity, 0)}</Text>
                        <Text><strong>Origen → Destino:</strong> {uniqueOrigenDestino.join(', ')}</Text>
                        <Link href={`/transferencias/historial/${transfer._id}`} passHref>
                          <Button as="a" colorScheme="blue" mt={2}>
                            Ver detalles
                          </Button>
                        </Link>
                      </Stack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default HistorialTransferenciasPage;