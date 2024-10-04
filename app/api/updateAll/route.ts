import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/Producto';

export async function PUT(req: Request) {
  try {
    await connectDB();
    
    // Actualizamos todos los productos para agregar el campo 'ajustado' y marcarlo como false
    const ajustadoResult = await Product.updateMany(
      {}, 
      {
        $set: {
          ajustado: false
        }
      }
    );

    // Actualizamos las existencias en las ubicaciones "L152" y "L258"
    const inventoryResult = await Product.updateMany(
      {
        'stockLocations': {
          $elemMatch: {
            'location': { $in: ['L152', 'L258'] }
          }
        }
      },
      {
        $inc: {
          'stockLocations.$[elem].quantity': 10000
        }
      },
      {
        arrayFilters: [{ 'elem.location': { $in: ['L152', 'L258'] } }],
        multi: true
      }
    );

    return NextResponse.json({ 
      message: `${ajustadoResult.modifiedCount} productos actualizados con el campo 'ajustado'. 
                Inventario actualizado en ${inventoryResult.modifiedCount} productos.`,
      ajustadoResult,
      inventoryResult
    });
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
    return NextResponse.json({ error: 'Error al actualizar los productos' }, { status: 500 });
  }
}   