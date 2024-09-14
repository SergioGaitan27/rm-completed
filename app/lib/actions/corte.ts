// app/lib/actions/corte.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Ticket from '@/app/lib/models/Ticket';
import Corte from '@/app/lib/models/Corte';

export async function realizarCorte(data: { location: string; actualCash: number; actualCard: number }) {
  try {
    await connectDB();

    const { location, actualCash, actualCard } = data;

    const now = new Date();
    const corteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await Ticket.aggregate([
      {
        $match: {
          location,
          date: { $gte: corteDate, $lt: now }
        }
      },
      {
        $group: {
          _id: null,
          expectedCash: {
            $sum: {
              $cond: [{ $eq: ["$paymentType", "cash"] }, "$totalAmount", 0]
            }
          },
          expectedCard: {
            $sum: {
              $cond: [{ $eq: ["$paymentType", "card"] }, "$totalAmount", 0]
            }
          },
          totalTickets: { $sum: 1 }
        }
      }
    ]);

    const { expectedCash, expectedCard, totalTickets } = result[0] || { expectedCash: 0, expectedCard: 0, totalTickets: 0 };

    const newCorte = new Corte({
      location,
      date: corteDate,
      expectedCash,
      expectedCard,
      actualCash,
      actualCard,
      totalTickets
    });
    await newCorte.save();

    return NextResponse.json({
      success: true,
      data: {
        expectedCash,
        expectedCard,
        actualCash,
        actualCard,
        totalTickets,
        corteId: newCorte._id
      }
    });

  } catch (error) {
    console.error('Error al realizar el corte:', error);
    return NextResponse.json({ success: false, message: 'Error al realizar el corte' }, { status: 500 });
  }
}