'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { toast } from 'react-hot-toast';
import moment from 'moment-timezone';
import TicketDetailsModal from '@/app/components/TicketDetailsModal';

const TIMEZONE = 'America/Mexico_City';

interface Ticket {
  ticketId: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  paymentType: 'cash' | 'card';
  fulfillmentStatus: 'pending' | 'processing' | 'completed';
  date: string;
  items: {
    productName: string;
    quantity: number;
    unitType: 'pieces' | 'boxes';
    pricePerUnit: number;
    total: number;
  }[];
  amountPaid: number;
  change: number;
}

const WarehouseOrderManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Ticket | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [printerConfig, setPrinterConfig] = useState({ printerName: '', paperSize: '80mm' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const today = moment().tz(TIMEZONE);
      const formattedDate = today.format('YYYY-MM-DD');
      setStartDate(formattedDate);
      setEndDate(formattedDate);
      fetchOrders(formattedDate, formattedDate);

      const savedConfig = localStorage.getItem('printerConfig');
      if (savedConfig) {
        setPrinterConfig(JSON.parse(savedConfig));
      }
    }
  }, [status, router]);

  const fetchOrders = async (start: string, end: string) => {
    setLoading(true);
    try {
      const startDateMx = moment.tz(start, TIMEZONE).startOf('day').format();
      const endDateMx = moment.tz(end, TIMEZONE).endOf('day').format();
      
      const response = await fetch(`/api/mobileTickets?startDate=${encodeURIComponent(startDateMx)}&endDate=${encodeURIComponent(endDateMx)}`);
      if (!response.ok) throw new Error('Error al obtener pedidos');
      const data = await response.json();
      setOrders(data.data.filter((order: Ticket) => order.fulfillmentStatus !== 'completed'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrders(startDate, endDate);
  };

  const handleCompleteOrder = async (order: Ticket) => {
    if (order.paymentStatus !== 'paid') {
      toast.error('Solo se pueden completar pedidos pagados');
      return;
    }

    try {
      const response = await fetch('/api/mobileTickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: order.ticketId, 
          fulfillmentStatus: 'completed'
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar el estado del pedido');
      
      const updatedOrder = await response.json();
      
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.ticketId === updatedOrder.data.ticketId ? updatedOrder.data : o
        ).filter(o => o.fulfillmentStatus !== 'completed')
      );

      toast.success('Pedido completado exitosamente');
      
      setSelectedOrder(updatedOrder.data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar el pedido');
    }
  };

  const handleViewDetails = (order: Ticket) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
  };

  const getFulfillmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'processing':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-red-200 text-red-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Pedidos en Bodega</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtrar Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Fecha de inicio"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Fecha de fin"
            />
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID de Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Estado en Bodega</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.ticketId}>
                <TableCell>{order.ticketId}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus === 'paid' ? 'Pagado' : 'No pagado'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                    {order.fulfillmentStatus === 'pending' ? 'Pendiente' : 'En proceso'}
                  </span>
                </TableCell>
                <TableCell>{moment(order.date).tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                <TableCell>
                  <Button onClick={() => handleViewDetails(order)} className="mr-2">Ver Detalles</Button>
                  {order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'completed' && (
                    <Button onClick={() => handleCompleteOrder(order)}>Completar Pedido</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedOrder && isDetailsModalOpen && (
        <TicketDetailsModal
          ticket={selectedOrder}
          onClose={() => setIsDetailsModalOpen(false)}
          printerConfig={printerConfig}
        />
      )}
    </div>
  );
};

export default WarehouseOrderManagement;