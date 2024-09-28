// pages/TicketManagementPage.tsx

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
import PaymentModalMobile from '@/app/components/PaymentModalMobile';

const TIMEZONE = 'America/Mexico_City';

interface Ticket {
  ticketId: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  paymentType: 'cash' | 'card'; 
  fulfillmentStatus: 'pending' | 'processing' | 'completed';
  date: string;
  amountPaid: number;
  change: number;
  items: {
    productName: string;
    quantity: number;
    unitType: 'pieces' | 'boxes';
    pricePerUnit: number;
    total: number;
  }[];
}

const TicketManagementPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [printerConfig, setPrinterConfig] = useState<{ printerName: string; paperSize: string }>({
    printerName: '',
    paperSize: '80mm',
  });
  const [isPaymentModalMobileOpen, setIsPaymentModalMobileOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const today = moment().tz(TIMEZONE);
      const formattedDate = today.format('YYYY-MM-DD');
      setStartDate(formattedDate);
      setEndDate(formattedDate);
      fetchTickets(formattedDate, formattedDate);

      const savedConfig = localStorage.getItem('printerConfig');
      if (savedConfig) {
        setPrinterConfig(JSON.parse(savedConfig));
      }
    }
  }, [status, router]);

  const fetchTickets = async (start: string, end: string) => {
    setLoading(true);
    try {
      const startDateMx = moment.tz(start, TIMEZONE).startOf('day').format();
      const endDateMx = moment.tz(end, TIMEZONE).endOf('day').format();
      
      const response = await fetch(`/api/mobileTickets?startDate=${encodeURIComponent(startDateMx)}&endDate=${encodeURIComponent(endDateMx)}`);
      if (!response.ok) throw new Error('Error al obtener tickets');
      const data = await response.json();
      setTickets(data.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTickets(startDate, endDate);
  };

  const handlePaymentStatusChange = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsPaymentModalMobileOpen(true);
    setPaymentType(ticket.paymentType);
    setAmountPaid(ticket.amountPaid.toString());
    setChange(ticket.change);
  };

  const handlePaymentTypeChange = (value: 'cash' | 'card') => {
    setPaymentType(value);
    if (value === 'card') {
      setAmountPaid(selectedTicket?.totalAmount.toFixed(2) || '');
      setChange(0);
    } else {
      setAmountPaid('');
      setChange(0);
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    if (selectedTicket) {
      const paid = parseFloat(value);
      setChange(isNaN(paid) ? 0 : paid - selectedTicket.totalAmount);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTicket) return;

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/mobileTickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: selectedTicket.ticketId, 
          paymentStatus: 'paid',
          fulfillmentStatus: 'processing',
          paymentType,
          amountPaid: parseFloat(amountPaid),
          change
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar el estado de pago');
      
      const updatedTicket = await response.json();
      
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.ticketId === updatedTicket.data.ticketId ? updatedTicket.data : ticket
        )
      );

      setSelectedTicket(updatedTicket.data);
      
      toast.success('Pago procesado exitosamente');
      setIsPaymentModalMobileOpen(false);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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
      <h1 className="text-2xl font-bold mb-4">Administración de Tickets</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtrar Tickets</CardTitle>
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
        <p>Cargando tickets...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID de Ticket</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Forma de Pago</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Estado en bodega</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.ticketId}>
                <TableCell>{ticket.ticketId}</TableCell>
                <TableCell>{ticket.customerName}</TableCell>
                <TableCell>${ticket.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full ${getPaymentStatusColor(ticket.paymentStatus)}`}>
                    {ticket.paymentStatus === 'paid' ? 'Pagado' : 'No pagado'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full ${getFulfillmentStatusColor(ticket.fulfillmentStatus)}`}>
                    {ticket.fulfillmentStatus === 'pending' ? 'Pendiente' : 
                     ticket.fulfillmentStatus === 'processing' ? 'En proceso' : 'Completado'}
                  </span>
                </TableCell>
                <TableCell>{moment(ticket.date).tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                <TableCell>
                  <Button onClick={() => handleViewDetails(ticket)} className="mr-2">Ver Detalles</Button>
                  {ticket.paymentStatus === 'unpaid' && (
                    <Button onClick={() => handlePaymentStatusChange(ticket)}>Procesar Pago</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedTicket && isDetailsModalOpen && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setIsDetailsModalOpen(false)}
          printerConfig={printerConfig}
        />
      )}

      <PaymentModalMobile
        isOpen={isPaymentModalMobileOpen}
        onClose={() => setIsPaymentModalMobileOpen(false)}
        paymentType={paymentType}
        amountPaid={amountPaid}
        change={change}
        totalAmount={selectedTicket?.totalAmount || 0}
        isLoading={isProcessingPayment}
        onPaymentTypeChange={handlePaymentTypeChange}
        onAmountPaidChange={handleAmountPaidChange}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};

export default TicketManagementPage;
