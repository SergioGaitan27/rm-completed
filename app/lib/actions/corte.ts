// app/lib/actions/corte.ts

import { connectDB } from '@/app/lib/db/mongodb';
import Ticket from '@/app/lib/models/Ticket';
import Corte, { ICorte } from '@/app/lib/models/Corte';
import moment from 'moment-timezone';

interface CorteData {
  actualCash: number;
  actualCard: number;
  location: string;
}

const TIMEZONE = 'America/Mexico_City';

export async function processCorte(corteData: CorteData) {
  await connectDB();

  const { location, actualCash, actualCard } = corteData;

  // Validar los montos ingresados
  if (isNaN(actualCash) || isNaN(actualCard)) {
    throw new Error('Montos de efectivo o tarjeta inválidos');
  }

  // Obtener los tickets del día para la ubicación actual
  const startOfDay = moment().tz(TIMEZONE).startOf('day').toDate();
  const endOfDay = moment().tz(TIMEZONE).endOf('day').toDate();

  const tickets = await Ticket.find({
    location: location,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  // Calcular los totales esperados
  const expectedCash = tickets
    .filter((ticket) => ticket.paymentType === 'cash')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

  const expectedCard = tickets
    .filter((ticket) => ticket.paymentType === 'card')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

  // Crear el corte
  const corte: ICorte = new Corte({
    location: location,
    date: moment().tz(TIMEZONE).toDate(),
    expectedCash,
    expectedCard,
    actualCash,
    actualCard,
    totalTickets: tickets.length,
  });

  await corte.save();

  return {
    expectedCash,
    expectedCard,
    actualCash,
    actualCard,
    totalTickets: tickets.length,
  };
}
