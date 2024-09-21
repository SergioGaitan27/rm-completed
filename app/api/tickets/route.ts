// app/api/tickets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processTicket, getTicketById, getTicketsInRange } from '@/app/lib/actions/tickets';
import moment from 'moment-timezone';

const TIMEZONE = 'America/Mexico_City';

export async function POST(req: NextRequest) {
  try {
    const ticketData = await req.json();
    const { newTicket, updatedProducts } = await processTicket(ticketData);

    return NextResponse.json({
      success: true,
      message: 'Ticket procesado exitosamente',
      data: {
        ticket: newTicket,
        updatedProducts
      }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const ticketId = searchParams.get('ticketId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (ticketId) {
      // Obtener un ticket por su ID
      const ticket = await getTicketById(ticketId);
      return NextResponse.json({
        success: true,
        data: ticket
      }, { status: 200 });
    } else if (startDateParam && endDateParam) {
      // Obtener los tickets en un rango de fechas
      const startDate = moment.tz(startDateParam, TIMEZONE).toDate();
      const endDate = moment.tz(endDateParam, TIMEZONE).toDate();
      const tickets = await getTicketsInRange(startDate, endDate);
      return NextResponse.json({
        success: true,
        data: tickets
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Parámetros insuficientes' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}
