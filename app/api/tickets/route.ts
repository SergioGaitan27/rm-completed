import { NextRequest, NextResponse } from 'next/server';
import { processTicket, getTicketStats } from '@/app/lib/actions/tickets';

export async function POST(req: NextRequest) {
  try {
    const ticketData = await req.json();
    const { newTicket, updatedProducts } = await processTicket(ticketData);

    return NextResponse.json({ 
      message: 'Ticket guardado exitosamente', 
      ticket: newTicket,
      updatedProducts: updatedProducts
    }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar el ticket:', error);
    return NextResponse.json({ error: 'Error al guardar el ticket' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    startDate.setHours(0, 0, 0, 0); // Inicio del día
    endDate.setHours(23, 59, 59, 999); // Fin del día

    const stats = await getTicketStats(startDate, endDate);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener los tickets:', error);
    return NextResponse.json({ error: 'Error al obtener los tickets' }, { status: 500 });
  }
}