// app/lib/actions/mobileTickets.ts

import { connectDB } from '@/app/lib/db/mongodb';
import MobileTicket, { IMobileTicket } from '@/app/lib/models/MobileTicket';
import Product, { IProduct, IStockLocation } from '@/app/lib/models/Producto';
import mongoose from 'mongoose';
import { pusherServer } from '@/app/utils/pusher';
import moment from 'moment-timezone';

const TIMEZONE = 'America/Mexico_City';

interface SimpleMobileTicketItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  costPerUnit: number;
  total: number;
  profit: number;
}

interface MobileTicketData {
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
  deviceId: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  employeeId: string;
  offlineCreated: boolean;
  customerName: string;
}

async function getNextSequenceNumber(location: string): Promise<number> {
  const lastTicket = await MobileTicket.findOne({ location }).sort('-sequenceNumber');
  return lastTicket ? lastTicket.sequenceNumber + 1 : 1;
}

export async function processMobileTicket(ticketData: MobileTicketData) {
    await connectDB();

    const { items, totalAmount, paymentType, amountPaid, change, location, deviceId, gpsCoordinates, employeeId, offlineCreated, customerName } = ticketData;
  
    const sequenceNumber = await getNextSequenceNumber(location);
    const ticketId = `${location}-M-${sequenceNumber.toString().padStart(6, '0')}`;
  
  let totalProfit = 0;
  const updatedItems: SimpleMobileTicketItem[] = await Promise.all(items.map(async (item) => {
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

  const newTicket: IMobileTicket = new MobileTicket({
    ticketId,
    location,
    sequenceNumber,
    customerName, // New field
    items: updatedItems,
    totalAmount,
    totalProfit,
    paymentType,
    amountPaid,
    change,
    date: moment().tz(TIMEZONE).toDate(),
    deviceId,
    gpsCoordinates,
    employeeId,
    syncStatus: 'synced',
    offlineCreated
  });

  if (pusherServer) {
    await pusherServer.trigger('mobile-sales-channel', 'new-mobile-sale', {
      ticketId: newTicket.ticketId,
      profit: totalProfit,
      location: location,
      totalAmount: totalAmount,
      paymentType: paymentType,
      itemsSold: updatedItems.length,
      timestamp: new Date().toISOString(),
      deviceId: deviceId,
      employeeId: employeeId,
      customerName: customerName // New field
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

export async function getMobileTicketById(ticketId: string) {
  await connectDB();

  if (!ticketId) {
    throw new Error('ID de ticket móvil no proporcionado');
  }

  const ticket = await MobileTicket.findOne({ ticketId }).lean();

  if (!ticket) {
    throw new Error('Ticket móvil no encontrado');
  }

  return ticket;
}

export async function getMobileTicketsInRange(startDate: Date, endDate: Date) {
  await connectDB();

  const startOfDay = moment(startDate).tz(TIMEZONE).startOf('day').toDate();
  const endOfDay = moment(endDate).tz(TIMEZONE).endOf('day').toDate();

  const query: any = {
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  const tickets = await MobileTicket.find(query).sort({ date: -1 });

  return tickets;
}

export async function getMobileTicketStats(startDate: Date, endDate: Date) {
  await connectDB();

  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  const query: any = {
    date: { $gte: startDate, $lte: endDate },
  };

  const tickets = await MobileTicket.find(query).sort({ date: -1 });

  const locationProfits: Record<string, number> = {};
  const deviceProfits: Record<string, number> = {};
  const employeeProfits: Record<string, number> = {};
  let totalProfit = 0;

  tickets.forEach(ticket => {
    totalProfit += ticket.totalProfit;
    locationProfits[ticket.location] = (locationProfits[ticket.location] || 0) + ticket.totalProfit;
    deviceProfits[ticket.deviceId] = (deviceProfits[ticket.deviceId] || 0) + ticket.totalProfit;
    employeeProfits[ticket.employeeId] = (employeeProfits[ticket.employeeId] || 0) + ticket.totalProfit;
  });

  const locations = Object.keys(locationProfits).map(location => ({
    location,
    profit: locationProfits[location],
  }));

  const devices = Object.keys(deviceProfits).map(deviceId => ({
    deviceId,
    profit: deviceProfits[deviceId],
  }));

  const employees = Object.keys(employeeProfits).map(employeeId => ({
    employeeId,
    profit: employeeProfits[employeeId],
  }));

  return { totalProfit, locations, devices, employees };
}