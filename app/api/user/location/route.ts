import { NextResponse } from 'next/server';
import { getUserLocation } from '@/app/lib/actions/user';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const location = await getUserLocation();
    return NextResponse.json({ location });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      } else if (error.message === 'Usuario no encontrado') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    console.error('Error al obtener la ubicación del usuario:', error);
    return NextResponse.json({ error: 'Error al obtener la ubicación del usuario' }, { status: 500 });
  }
}