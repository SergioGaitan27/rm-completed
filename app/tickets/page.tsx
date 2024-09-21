// app/tickets/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { DateRangePicker } from "@/app/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { ITicket } from '@/app/types/product';
import TicketDetailsModal from '@/app/components/TicketDetailsModal';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { DateRange } from 'react-day-picker';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const TicketQueryPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchTickets = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Por favor, selecciona un rango de fechas');
      return;
    }

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', dateRange.from.toISOString());
      queryParams.append('endDate', dateRange.to.toISOString());

      const response = await fetch(`/api/tickets?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener tickets');
      }

      // Asegurarse de que data.data es un arreglo
      if (Array.isArray(data.data)) {
        setTickets(data.data);
        // Inicializar expandedLocations con todas las ubicaciones colapsadas por defecto
        const initialExpandedLocations = data.data.reduce((acc: Record<string, boolean>, ticket: ITicket) => {
          acc[ticket.location] = false; // Ahora las ubicaciones estarán colapsadas por defecto
          return acc;
        }, {});
        setExpandedLocations(initialExpandedLocations);
      } else {
        setTickets([]);
        toast.error('No se encontraron tickets en el rango de fechas seleccionado.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al obtener tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTickets();
  };

  const handleViewDetails = (ticket: ITicket) => {
    setSelectedTicket(ticket);
  };

  // Función para agrupar tickets por ubicación
  const groupTicketsByLocation = (tickets: ITicket[]) => {
    return tickets.reduce((groups: Record<string, ITicket[]>, ticket) => {
      const location = ticket.location || 'Sin ubicación';
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(ticket);
      return groups;
    }, {});
  };

  // Función para alternar la expansión de una ubicación
  const toggleLocation = (location: string) => {
    setExpandedLocations(prevState => ({
      ...prevState,
      [location]: !prevState[location],
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Consulta de Tickets</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Rango de fechas</label>
            <DateRangePicker
              value={dateRange}
              onValueChange={(range) => setDateRange(range)}
            />
          </div>
          <div className="flex space-x-4">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            Object.entries(groupTicketsByLocation(tickets)).map(([location, tickets]) => {
              // Calcular el total de la suma de los tickets por ubicación
              const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);
              return (
                <div key={location}>
                  <div
                    className="flex items-center cursor-pointer mt-6 mb-2"
                    onClick={() => toggleLocation(location)}
                  >
                    {expandedLocations[location] ? (
                      <FaChevronDown className="h-5 w-5 mr-2" />
                    ) : (
                      <FaChevronRight className="h-5 w-5 mr-2" />
                    )}
                    <h2 className="text-xl font-semibold">
                      {location} - Total: ${totalAmount.toFixed(2)}
                    </h2>
                  </div>
                  {expandedLocations[location] && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID de Ticket</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Tipo de Pago</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket._id}>
                            <TableCell>{ticket.ticketId}</TableCell>
                            <TableCell>{format(new Date(ticket.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>${ticket.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}</TableCell>
                            <TableCell>
                              <Button onClick={() => handleViewDetails(ticket)}>
                                Ver detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center mt-4">No se encontraron tickets.</p>
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};

export default TicketQueryPage;
