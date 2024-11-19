// app/lib/actions/tickets.ts

import mongoose from 'mongoose';
import Sequence from '@/app/lib/models/Sequence';
import { connectDB } from '@/app/lib/db/mongodb';
import Ticket, { ITicket } from '@/app/lib/models/Ticket';
import Product from '@/app/lib/models/Producto';
import moment from 'moment-timezone';
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

const TIMEZONE = 'America/Mexico_City';

// Función para obtener el siguiente número de secuencia de manera atómica
async function getNextSequenceNumber(location: string, session: mongoose.ClientSession): Promise<number> {
  const updatedSequence = await Sequence.findByIdAndUpdate(
    location,
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true, session }
  );

  return updatedSequence.sequenceValue;
}

// Función principal para procesar un ticket sin considerar stock
export async function processTicket(ticketData: TicketData) {
  await connectDB();

  const MAX_RETRIES = 5;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        console.log(`Iniciando transacción (Intento ${attempt})`);

        const { items, totalAmount, paymentType, amountPaid, change, location } = ticketData;

        // Obtener el siguiente número de secuencia de manera atómica
        const sequenceNumber = await getNextSequenceNumber(location, session);
        console.log(`Secuencia obtenida: ${sequenceNumber}`);

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

        console.log('Guardando nuevo ticket:', newTicket.ticketId);
        await newTicket.save({ session });

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

        // **Eliminar la actualización de stock y movimientos de stock**
        // Toda la lógica relacionada con stock se ha eliminado

        console.log('Transacción completada exitosamente (Intento', attempt, ')');
        return { newTicket };
      }, {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
      });

      session.endSession();
      return result;
    } catch (error) {
      console.error(`Error en la transacción (Intento ${attempt}):`, error);
      await session.abortTransaction();
      session.endSession();

      if (attempt === MAX_RETRIES) {
        throw new Error('No se pudo completar la transacción después de varios intentos.');
      }

      // Esperar un breve período antes de reintentar (backoff exponencial)
      await new Promise(res => setTimeout(res, 100 * attempt));
    }
  }

  throw new Error('No se pudo completar la transacción.');
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

export async function getTicketById(ticketId: string): Promise<ITicket | null> {
  await connectDB();

  try {
    const ticket = await Ticket.findOne({ ticketId });
    return ticket;
  } catch (error) {
    console.error(`Error al obtener el ticket con ID ${ticketId}:`, error);
    throw error;
  }
}
