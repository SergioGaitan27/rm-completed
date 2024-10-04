// app/lib/actions/tickets.ts

import StockMovement, { IStockMovement, MovementType } from '@/app/lib/models/StockMovement';
import { connectDB } from '@/app/lib/db/mongodb';
import Ticket, { ITicket } from '@/app/lib/models/Ticket';
import Product, { IProduct, IStockLocation } from '@/app/lib/models/Producto';
import mongoose from 'mongoose';
import { pusherServer } from '@/app/utils/pusher';
import moment from 'moment-timezone';

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

// Función auxiliar para obtener el siguiente número de secuencia
async function getNextSequenceNumber(location: string): Promise<number> {
  const lastTicket = await Ticket.findOne({ location }).sort('-sequenceNumber');
  return lastTicket ? lastTicket.sequenceNumber + 1 : 1;
}

const TIMEZONE = 'America/Mexico_City';

// Función principal para procesar un ticket

export async function processTicket(ticketData: TicketData) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, totalAmount, paymentType, amountPaid, change, location } = ticketData;

    const sequenceNumber = await getNextSequenceNumber(location);
    const ticketId = `${location}-${sequenceNumber.toString().padStart(6, '0')}`;

    let totalProfit = 0;
    const updatedItems: SimpleTicketItem[] = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId).session(session);
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
      change,
      date: moment().tz(TIMEZONE).toDate()
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

    await newTicket.save({ session });

    // **Actualizar el stock de los productos en múltiples ubicaciones con orden específico**
    const updatedProductIds = await Promise.all(updatedItems.map(async (item) => {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        const totalPieces = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;

        // Definir el orden de las ubicaciones para deducir stock
        const userLocationDerived = `B${location.substring(1)}`; // B + ubicación del usuario sin la primera letra
        const secondaryLocations = ['B161-A', 'B161-B', 'B5']; // Ubicaciones adicionales en orden
        const orderedLocations = [location, userLocationDerived, ...secondaryLocations]; // 1. Ubicación actual, 2. B + derivada, etc.

        let remainingToDeduct = totalPieces;

        console.log(`\nProcesando deducción de stock para el producto: ${product.name}`);
        console.log(`Cantidad a deducir (en piezas): ${totalPieces}`);
        console.log(`Orden de ubicaciones a verificar: ${orderedLocations.join(', ')}`);

        for (const loc of orderedLocations) {
          if (remainingToDeduct <= 0) break;

          const stockLocation = product.stockLocations.find((locationObj: IStockLocation) => locationObj.location === loc);

          if (stockLocation) {
            console.log(`Ubicación: ${loc}, Stock disponible: ${stockLocation.quantity}`);

            if (stockLocation.quantity > 0) {
              const available = stockLocation.quantity;

              if (available >= remainingToDeduct) {
                stockLocation.quantity -= remainingToDeduct;
                console.log(`Deducted ${remainingToDeduct} piezas de ${loc}. Nuevo stock: ${stockLocation.quantity}`);

                // **Registrar el movimiento de stock**
                const movement: IStockMovement = new StockMovement({
                  productId: product._id,
                  quantityChange: -remainingToDeduct,
                  location: loc,
                  movementType: 'sale',
                  ticketId: ticketId,
                  date: new Date(),
                  // performedBy: 'user-id' // Opcional: Añade aquí el ID del usuario si aplica
                });

                await movement.save({ session });

                remainingToDeduct = 0;
              } else {
                stockLocation.quantity = 0;
                console.log(`Deducted ${available} piezas de ${loc}. Nuevo stock: ${stockLocation.quantity}`);

                // **Registrar el movimiento de stock**
                const movement: IStockMovement = new StockMovement({
                  productId: product._id,
                  quantityChange: -available,
                  location: loc,
                  movementType: 'sale',
                  ticketId: ticketId,
                  date: new Date(),
                  // performedBy: 'user-id' // Opcional
                });

                await movement.save({ session });

                remainingToDeduct -= available;
              }
            } else {
              console.log(`No hay stock disponible en ${loc}.`);
            }
          } else {
            console.log(`La ubicación ${loc} no existe para este producto.`);
          }
        }

        if (remainingToDeduct > 0) {
          console.error(`Stock insuficiente para el producto ${product.name}. Cantidad faltante: ${remainingToDeduct} piezas.`);
          throw new Error(`Stock insuficiente para el producto ${product.name}. Cantidad faltante: ${remainingToDeduct} piezas.`);
        }

        await product.save({ session });
        console.log(`Stock actualizado para el producto ${product.name}.\n`);
        return product._id.toString();
      }
      return null;
    }));

    const updatedProducts = await Product.find({ _id: { $in: updatedProductIds.filter(Boolean) } }).session(session);

    await session.commitTransaction();
    session.endSession();

    return { newTicket, updatedProducts };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}


// Función para obtener un ticket por su ID
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

// Función para obtener los tickets en un rango de fechas
export async function getTicketsInRange(startDate: Date, endDate: Date) {
  await connectDB();

  const startOfDay = moment(startDate).tz(TIMEZONE).startOf('day').toDate();
  const endOfDay = moment(endDate).tz(TIMEZONE).endOf('day').toDate();

  const query: any = {
    date: { $gte: startOfDay, $lte: endOfDay },
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
