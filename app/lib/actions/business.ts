// app/lib/actions/business.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import BusinessInfo from '@/app/lib/models/BusinessInfo';

export async function getBusinessInfo(location: string | null) {
  try {
    await connectDB();

    if (location) {
      const businessInfo = await BusinessInfo.findOne({ location });

      if (!businessInfo) {
        return NextResponse.json({ error: 'Información de negocio no encontrada' }, { status: 404 });
      }

      return NextResponse.json(businessInfo);
    } else {
      const allBusinesses = await BusinessInfo.find({});
      return NextResponse.json(allBusinesses);
    }
  } catch (error) {
    console.error('Error al obtener la información del negocio:', error);
    return NextResponse.json({ error: 'Error al obtener la información del negocio' }, { status: 500 });
  }
}

export async function createBusinessInfo(data: any) {
  try {
    await connectDB();

    const newBusinessInfo = new BusinessInfo(data);
    await newBusinessInfo.save();

    return NextResponse.json(newBusinessInfo, { status: 201 });
  } catch (error) {
    console.error('Error al crear la información del negocio:', error);
    return NextResponse.json({ error: 'Error al crear la información del negocio' }, { status: 500 });
  }
}