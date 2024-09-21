// app/lib/actions/tickets.ts
import { connectDB } from '@/app/lib/db/mongodb';
import Ticket, { ITicket } from '@/app/lib/models/Ticket';
import Product, { IProduct, IStockLocation } from '@/app/lib/models/Producto';
import mongoose from 'mongoose';
import { pusherServer } from '@/app/utils/pusher';

// Interfaces
interface SimpleTicketItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  costPerUnit: number;
  total: number;
  profit: number;
}

interface TicketData {
  items: {
    productId: string;
    pricePerUnit: number;
    quantity: number;
    unitType: 'pieces' | 'boxes';
  }[];
  totalAmount: number;
  paymentType: 'cash' | 'card';
  amountPaid: number;
  change: number;
  location: string;
}

// Función auxiliar
async function getNextSequenceNumber(location: string): Promise<number> {
  const lastTicket = await Ticket.findOne({ location }).sort('-sequenceNumber');
  return lastTicket ? lastTicket.sequenceNumber + 1 : 1;
}

// Función principal para procesar un ticket
export async function processTicket(ticketData: TicketData) {
  await connectDB();
  
  const { items, totalAmount, paymentType, amountPaid, change, location } = ticketData;
  
  const sequenceNumber = await getNextSequenceNumber(location);
  const ticketId = `${location}-${sequenceNumber.toString().padStart(6, '0')}`;

  let totalProfit = 0;
  const updatedItems: SimpleTicketItem[] = await Promise.all(items.map(async (item) => {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Producto no encontrado: ${item.productId}`);
    }

    const costPerUnit = product.cost;
    const pricePerUnit = item.pricePerUnit;
    const quantity = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
    const profit = (pricePerUnit - costPerUnit) * quantity;

    totalProfit += profit;

    return {
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      unitType: item.unitType,
      pricePerUnit: pricePerUnit,
      costPerUnit: costPerUnit,
      total: pricePerUnit * quantity,
      profit: profit
    };
  }));

  const newTicket: ITicket = new Ticket({
    ticketId,
    location,
    sequenceNumber,
    items: updatedItems,
    totalAmount,
    totalProfit,
    paymentType,
    amountPaid,
    change
  });

  if (pusherServer) {
    await pusherServer.trigger('sales-channel', 'new-sale', {
      ticketId: newTicket.ticketId,
    profit: totalProfit,
    location: location,
    totalAmount: totalAmount,
    paymentType: paymentType,
    itemsSold: updatedItems.length,
    timestamp: new Date().toISOString()
    });
  } else {
    console.warn('Pusher no está inicializado. No se pudo enviar el evento.');
  }

  await newTicket.save();

  // Actualizar el stock de los productos
  const updatedProductIds = await Promise.all(updatedItems.map(async (item) => {
    const product = await Product.findById(item.productId);
    if (product) {
      const totalPieces = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
      const locationIndex = product.stockLocations.findIndex((loc: IStockLocation) => loc.location === location);
      if (locationIndex !== -1) {
        product.stockLocations[locationIndex].quantity -= totalPieces;
        await product.save();
        return product._id.toString();
      }
    }
    return null;
  }));

  const updatedProducts = await Product.find({ _id: { $in: updatedProductIds.filter(Boolean) } });

  return { newTicket, updatedProducts };
}

export async function getTicketById(ticketId: string) {
    await connectDB();
  
    if (!ticketId) {
      throw new Error('ID de ticket no proporcionado');
    }
  
    const ticket = await Ticket.findOne({ ticketId }).lean();
  
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }
  
    return ticket;
  }

  export async function getTicketStats(startDate: Date, endDate: Date) {
    await connectDB();
  
    startDate.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC
    endDate.setUTCHours(23, 59, 59, 999); // Fin del día en UTC
  
    const query: any = {
      date: { $gte: startDate, $lte: endDate },
    };

  const tickets = await Ticket.find(query).sort({ date: -1 });

  // Calcular el beneficio total, conteo de ventas, y agrupar por ubicación
  const locationProfits: Record<string, number> = {};
  let totalProfit = 0;
  tickets.forEach(ticket => {
    totalProfit += ticket.totalProfit;
    locationProfits[ticket.location] = (locationProfits[ticket.location] || 0) + ticket.totalProfit;
  });

  const locations = Object.keys(locationProfits).map(location => ({
    location,
    profit: locationProfits[location],
  }));

  return { totalProfit, locations };
}