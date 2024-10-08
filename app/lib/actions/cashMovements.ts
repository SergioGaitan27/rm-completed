import { connectDB } from '@/app/lib/db/mongodb';
import CashMovement, { ICashMovement } from '@/app/lib/models/CashMovement';
import moment from 'moment-timezone';

const TIMEZONE = 'America/Mexico_City';

interface CashMovementData {
  amount: number;
  concept: string;
  type: 'in' | 'out';
  location: string; // Nuevo campo
}

export async function processCashMovement(data: CashMovementData) {
  await connectDB();

  const { amount, concept, type, location } = data;

  const cashMovement: ICashMovement = new CashMovement({
    amount,
    concept,
    type,
    date: moment().tz(TIMEZONE).toDate(),
    location, // Asignar la ubicación
  });

  await cashMovement.save();
}
