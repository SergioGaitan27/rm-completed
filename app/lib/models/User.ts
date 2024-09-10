// app/lib/models/User.ts
import mongoose, { Schema, model } from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  image?: string;
  role: 'super_administrador' | 'administrador' | 'vendedor' | 'cliente' | 'sistemas';
  location: string; // Nuevo campo
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    phone: {
      type: String,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['super_administrador', 'administrador', 'vendedor', 'cliente', 'sistemas'],
      default: 'cliente',
      required: [true, "Role is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models?.User || model<UserDocument>('User', UserSchema);
export default User;