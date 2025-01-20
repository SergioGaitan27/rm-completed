// app/lib/actions/corte.ts

import { connectDB } from '@/app/lib/db/mongodb';
import Ticket from '@/app/lib/models/Ticket';
import MobileTicket from '@/app/lib/models/MobileTicket';
import CashMovement from '@/app/lib/models/CashMovement';
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

  // Obtener tickets del día y ubicación
  const startOfDay = moment().tz(TIMEZONE).startOf('day').toDate();
  const endOfDay = moment().tz(TIMEZONE).endOf('day').toDate();

  const tickets = await Ticket.find({
    location: location,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  const mobileTickets = await MobileTicket.find({
    location: location,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  const cashMovements = await CashMovement.find({
    location: location,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  // Calcular montos esperados
  const expectedCashTickets = tickets
    .filter((ticket) => ticket.paymentType === 'cash')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

  const expectedCardTickets = tickets
    .filter((ticket) => ticket.paymentType === 'card')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

  const expectedCashMobileTickets = mobileTickets
    .filter((ticket) => ticket.paymentType === 'cash')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

  const expectedCardMobileTickets = mobileTickets
    .filter((ticket) => ticket.paymentType === 'card')
    .reduce((sum, ticket) => sum + ticket.totalAmount, 0);


  const expectedCash = expectedCashTickets + expectedCashMobileTickets ;
  const expectedCard = expectedCardTickets + expectedCardMobileTickets;

  // Crear el corte
  const corte: ICorte = new Corte({
    location: location,
    date: moment().tz(TIMEZONE).toDate(),
    expectedCash,
    expectedCard,
    actualCash,
    actualCard,
    totalTickets: tickets.length + mobileTickets.length,
  });

  await corte.save();

  return {
    location,
    expectedCash,
    expectedCard,
    actualCash,
    actualCard,
    totalTickets: tickets.length + mobileTickets.length,
    cashMovements, // Incluir los movimientos de efectivo
  };
}
