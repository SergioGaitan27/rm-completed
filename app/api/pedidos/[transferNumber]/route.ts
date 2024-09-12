import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Transfer from '@/app/lib/models/Transfer';


export async function GET(req: NextRequest, { params }: { params: { transferNumber: string } }) {
    try {
      await connectDB();
  
      const transfer = await Transfer.findById(params.transferNumber);
  
      if (!transfer) {
        return NextResponse.json({ message: 'Transferencia no encontrada' }, { status: 404 });
      }
  
      return NextResponse.json(transfer, { status: 200 });
    } catch (error) {
      console.error('Error al obtener los detalles de la transferencia:', error);
      return NextResponse.json({ 
        message: 'Error al obtener los detalles de la transferencia', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }