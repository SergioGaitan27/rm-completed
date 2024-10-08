import { connectDB } from '@/app/lib/db/mongodb';
import Ticket from '@/app/lib/models/Ticket';
import MobileTicket from '@/app/lib/models/MobileTicket';
import CashMovement from '@/app/lib/models/CashMovement';
import Corte, { ICorte } from '@/app/lib/models/Corte';
import moment from 'moment-timezone';

interface CorteData {
  actualCash: number;
  actualCard: number;
  location: string; // Asegurarse de que location está incluido
}

const TIMEZONE = 'America/Mexico_City';

export async function processCorte(corteData: CorteData) {
  await connectDB();

  const { location, actualCash, actualCard } = corteData;

  // Validate the entered amounts
  if (isNaN(actualCash) || isNaN(actualCard)) {
    throw new Error('Montos de efectivo o tarjeta inválidos');
  }

  // Get tickets for the day and location
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
    location: location, // Filtrar por location
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  // Calculate expected amounts
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

  const expectedCashMovements = cashMovements
    .reduce((sum, movement) => {
      return movement.type === 'in' ? sum + movement.amount : sum - movement.amount;
    }, 0);

  const expectedCash = expectedCashTickets + expectedCashMobileTickets + expectedCashMovements;
  const expectedCard = expectedCardTickets + expectedCardMobileTickets;

  // Create the corte
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
    location, // Incluir location
    expectedCash,
    expectedCard,
    actualCash,
    actualCard,
    totalTickets: tickets.length + mobileTickets.length,
  };
}