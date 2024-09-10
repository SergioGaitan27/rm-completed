import { connectDB } from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/User';
import { getServerSession } from "next-auth/next";
import getAuthOptions from "@/app/lib/actions/auth";

export async function getUserLocation() {
  const authOptions = getAuthOptions();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('No autenticado');
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user.location;
}