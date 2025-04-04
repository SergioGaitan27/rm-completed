// components/TicketDetailsModal.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import moment from 'moment-timezone';
import ConectorPluginV3 from '@/app/utils/ConectorPluginV3';
import { toast } from 'react-hot-toast';

const TIMEZONE = 'America/Mexico_City';

interface TicketItem {
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  total: number;
  piecesPerBox?: number;
}

interface Ticket {
  ticketId: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  paymentType: 'cash' | 'card';
  fulfillmentStatus: 'pending' | 'processing' | 'completed';
  date: string;
  items: TicketItem[];
}

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
  printerConfig: { printerName: string; paperSize: string };
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose, printerConfig }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const combineItems = (items: TicketItem[]): TicketItem[] => {
    const combinedItems: { [key: string]: TicketItem } = {};

    items.forEach(item => {
      if (combinedItems[item.productName]) {
        const existingItem = combinedItems[item.productName];
        const totalPieces = calculateTotalPieces(existingItem) + calculateTotalPieces(item);
        existingItem.quantity = totalPieces;
        existingItem.unitType = 'pieces';
        existingItem.total = totalPieces * item.pricePerUnit;
      } else {
        combinedItems[item.productName] = { 
          ...item, 
          quantity: calculateTotalPieces(item),
          unitType: 'pieces',
          total: calculateTotalPieces(item) * item.pricePerUnit
        };
      }
    });

    return Object.values(combinedItems);
  };

  const calculateTotalPieces = (item: TicketItem): number => {
    if (item.unitType === 'pieces') {
      return item.quantity;
    } else if (item.unitType === 'boxes' && item.piecesPerBox) {
      return item.quantity * item.piecesPerBox;
    }
    return item.quantity;
  };

  const printTicket = async () => {
    setIsPrinting(true);
    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjUtMDEtMDdfXzIwMjUtMDMtMDgjIyMzYUtWT2pCUVBOcURpaDFtWldWMTZaN2tBTythL2lQdTFJMmtJTHFsSzluTkhlRWswY2dGanBUS2V2dCtzSTZrMVAyZmtaN29henJ1UlZmQTBYNmYwbEtncFphTVdqMU1TNDdLMmtxM0IvaDB0R0M0TzVScE9uNncxTnJpNEIxNCsxbnlHZ2gvVzUyRXVtK0ptZ2VycU1HTWRCR1ZHZEFJb3g4QlQ4VWFOV0dVY0FkVlB1WFZtVVFmL0NsNks4d0xCd0gweEZmZkZSN09rMStORHVCQmZ6clEwUVptekVCVngwemxVYndwNFZqSTVaZnJ6Uzl0ZndDNThRTHZDc0M1Vk9abzIxTDhDam1oMGsxWkM1M1dJSGNxMkNvNG5VMTZRNW4zNTIxUk4ybThmZUtjZlMwS0ZHTmpLbUdUbkNaQmhzZFhqcHhQZXRiZS8xKytlRDFHd2EyOVhvS3BnSHpFczU2YUdJeW5Pa1lrRnA5cjJZUjE4TGY0VTlvZ2Q5d3MxVnpsN2tTcUFkODNQTUVFQ3psTksyQlZMc2xRNytMOVZFaHhGVWxSK1A4eUF2eW1ycTJGV3BGT2RNU3c4bnowcUtuZ3V2b05hZEpTTWhtR0owaVNieStONmJXT0xMbm5CV3UzcTFrK2ZzNGZZTTJPLzd4QTZzVXpPQ01EcERPVzhuSkt5UFJBaU5GYTRhRjRtRHgwdDBJUCt3NGJCQ3JNZTZyUDluK2FZSDBxcVZMcmpGSmdtQTQvb1lLc2FiOXBBUjBrS01FRThlaGhza25hUE5uRWJmWXpLRzRrZnNrY1ROTEVzWmRVc2lRWlVJRzltcWU5QXFya1IvWVhQREIvRUZnZTBubDhhZXV6NFl0U2pUV3V1V0JhSzFqS0RhQmZ3VlhzelE3QTBJOD0');
      
      conector.Iniciar();

      // Configuración de la impresión
      let anchoCaracteres;
      switch (printerConfig.paperSize) {
        case '58mm':
          anchoCaracteres = 32;
          break;
        case '80mm':
          anchoCaracteres = 48;
          break;
        case 'A4':
          anchoCaracteres = 64;
          break;
        default:
          anchoCaracteres = 48;
      }

      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
      conector.EstablecerEnfatizado(true);
      conector.EscribirTexto("Ticket de Venta\n\n");
      conector.EstablecerEnfatizado(false);
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);

      conector.EscribirTexto(`ID Ticket: ${ticket.ticketId}\n`);
      conector.EscribirTexto(`Cliente: ${ticket.customerName}\n`);
      conector.EscribirTexto(`Fecha: ${moment(ticket.date).tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss')}\n`);
      conector.EscribirTexto(`Estado de Pago: ${ticket.paymentStatus === 'paid' ? 'Pagado' : 'No Pagado'}\n`);
      conector.EscribirTexto(`Forma de Pago: ${ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}\n`);
      conector.EscribirTexto(`Estado: ${ticket.fulfillmentStatus === 'pending' ? 'Pendiente' : 
                           ticket.fulfillmentStatus === 'processing' ? 'En proceso' : 'Completado'}\n`);
      conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");

      const combinedItems = combineItems(ticket.items);
      combinedItems.forEach(item => {
        conector.EscribirTexto(`${item.productName}\n`);
        conector.EscribirTexto(`${item.quantity} x $${item.pricePerUnit.toFixed(2)} = $${item.total.toFixed(2)}\n`);
      });

      conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
      conector.EstablecerEnfatizado(true);
      conector.EscribirTexto(`Total: $${ticket.totalAmount.toFixed(2)}\n`);
      conector.EstablecerEnfatizado(false);

      conector.Corte(1);

      // Llamada a la API de impresión
      const resultado = await conector.imprimirEn(printerConfig.printerName);
      console.log('Resultado de imprimirEn:', resultado);

      // Manejo de la respuesta
      if (resultado.success) {
        toast.success('Ticket impreso correctamente');
        onClose();
      } else if (resultado.error) {
        throw new Error(resultado.error);
      } else {
        throw new Error('La impresión no se completó correctamente');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al imprimir el ticket');
    } finally {
      setIsPrinting(false);
    }
  };

  const combinedItems = combineItems(ticket.items);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Ticket: {ticket.ticketId}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Cliente:</strong> {ticket.customerName}</p>
            <p><strong>Fecha:</strong> {moment(ticket.date).tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss')}</p>
            <p><strong>Estado de Pago:</strong> {ticket.paymentStatus === 'paid' ? 'Pagado' : 'No Pagado'}</p>
          </div>
          <div>
            <p><strong>Total:</strong> ${ticket.totalAmount.toFixed(2)}</p>
            <p><strong>Forma de Pago:</strong> {ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}</p>
            <p><strong>Estado de Cumplimiento:</strong> {
              ticket.fulfillmentStatus === 'pending' ? 'Pendiente' :
              ticket.fulfillmentStatus === 'processing' ? 'En Proceso' : 'Completado'
            }</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Piezas Totales</TableHead>
              <TableHead>Precio Unitario</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                <TableCell>${(item.quantity * item.pricePerUnit).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-end">
          <Button onClick={printTicket} disabled={isPrinting}>
            {isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailsModal;
