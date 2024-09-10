import { NextRequest, NextResponse } from 'next/server';
import { getTicketById } from '@/app/lib/actions/tickets';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const ticket = await getTicketById(ticketId);
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error al obtener el ticket:', error);
    if (error instanceof Error) {
      if (error.message === 'ID de ticket no proporcionado') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      } else if (error.message === 'Ticket no encontrado') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}