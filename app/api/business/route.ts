import { NextRequest, NextResponse } from 'next/server';
import { getBusinessInfo, createBusinessInfo } from '@/app/lib/actions/business';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');
  return getBusinessInfo(location);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  return createBusinessInfo(data);
}