// app/api/mobileTickets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processMobileTicket, getMobileTicketById, getMobileTicketsInRange, getMobileTicketStats } from '@/app/lib/actions/mobileTickets';
import moment from 'moment-timezone';

const TIMEZONE = 'America/Mexico_City';

export async function POST(req: NextRequest) {
    try {
      const ticketData = await req.json();
      // Ensure customerName is included in ticketData
      if (!ticketData.customerName) {
        ticketData.customerName = ''; // Set a default value if not provided
      }
      const { newTicket, updatedProducts } = await processMobileTicket(ticketData);
  
      return NextResponse.json({
        success: true,
        message: 'Ticket móvil procesado exitosamente',
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
    const getStats = searchParams.get('getStats');

    if (ticketId) {
      // Obtener un ticket móvil por su ID
      const ticket = await getMobileTicketById(ticketId);
      return NextResponse.json({
        success: true,
        data: ticket
      }, { status: 200 });
    } else if (startDateParam && endDateParam) {
      // Convertir las fechas a objetos Date
      const startDate = moment.tz(startDateParam, TIMEZONE).toDate();
      const endDate = moment.tz(endDateParam, TIMEZONE).toDate();

      if (getStats === 'true') {
        // Obtener estadísticas de tickets móviles en un rango de fechas
        const stats = await getMobileTicketStats(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: stats
        }, { status: 200 });
      } else {
        // Obtener los tickets móviles en un rango de fechas
        const tickets = await getMobileTicketsInRange(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: tickets
        }, { status: 200 });
      }
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