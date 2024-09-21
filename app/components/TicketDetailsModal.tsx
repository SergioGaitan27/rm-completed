import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { ITicket } from '@/app/types/product';
import { format } from 'date-fns';

interface TicketDetailsModalProps {
  ticket: ITicket;
  onClose: () => void;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Ticket {ticket.ticketId}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p><strong>Fecha:</strong> {format(new Date(ticket.date), 'dd/MM/yyyy HH:mm')}</p>
          <p><strong>Ubicación:</strong> {ticket.location}</p>
          <p><strong>Tipo de Pago:</strong> {ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}</p>
          <p><strong>Total:</strong> ${ticket.totalAmount.toFixed(2)}</p>
          <p><strong>Ganancia Total:</strong> ${ticket.totalProfit.toFixed(2)}</p>
          
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ganancia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticket.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantity} {item.unitType}</TableCell>
                  <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                  <TableCell>${item.total.toFixed(2)}</TableCell>
                  <TableCell>${item.profit.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailsModal;