// app/api/stockMovements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import StockMovement from '@/app/lib/models/StockMovement';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const productId = searchParams.get('productId');
    const location = searchParams.get('location');
    const movementType = searchParams.get('movementType');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json(
          { success: false, message: 'productId inválido' },
          { status: 400 }
        );
      }
      query.productId = productId;
    }

    if (location) {
      query.location = location;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('productId', 'name') // Popula el campo productId con solo el nombre
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json(
      {
        success: true,
        data: movements,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error detallado:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const movementData = await req.json();
    const { productId, quantityChange, location, movementType, ticketId, performedBy } = movementData;

    // Validaciones básicas
    if (!productId || !quantityChange || !location || !movementType) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar el tipo de movimiento
    const validMovementTypes = ['sale', 'restock', 'return', 'adjustment'];
    if (!validMovementTypes.includes(movementType)) {
      return NextResponse.json(
        { success: false, message: 'movementType inválido' },
        { status: 400 }
      );
    }

    const movement = new StockMovement({
      productId,
      quantityChange,
      location,
      movementType,
      ticketId,
      date: new Date(),
      performedBy,
    });

    await movement.save();

    return NextResponse.json(
      { success: true, data: movement },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error detallado:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error desconocido' },
      { status: 500 }
    );
  }
}
