import { NextRequest, NextResponse } from 'next/server';
import { realizarCorte } from '@/app/lib/actions/corte';

export async function POST(req: NextRequest) {
  const data = await req.json();
  return realizarCorte(data);
}