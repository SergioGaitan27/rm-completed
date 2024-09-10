// app/lib/actions/register.ts
"use server"
import { connectDB } from "@/app/lib/db/mongodb";
import User from "@/app/lib/models/User";
import bcrypt from "bcryptjs";

export const register = async (values: any) => {
    const { email, password, name, location } = values;

    try {
        await connectDB();
        const userFound = await User.findOne({ email });
        if(userFound){
            return {
                error: 'Email already exists!'
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
          name,
          email,
          password: hashedPassword,
          location,
        });
        const savedUser = await user.save();

        return { success: true, user: savedUser };

    }catch(e){
        console.log(e);
        return { error: 'An error occurred during registration' };
    }
}