"use server";
import bcrypt from "bcryptjs";
import { signInSchema } from "~/schemas/auth";
import { db } from "~/server/db";

export const signup = async (email: string, password: string) => {
  //Validation
  const isValid = signInSchema.safeParse({ email, password });

  if (isValid.error) {
    return { success: false, error: "Invalid input" };
  }

  //See if user exists

  const user = await db.user.findUnique({
    where: {
      email: isValid.data.email,
    },
  });

  if (user) {
    return { success: false, error: "User already exists" };
  }

  //Encrypt password
  const hash = await bcrypt.hash(isValid.data.password, 10);

  //Create the user
  await db.user.create({
    data: {
      email: isValid.data.email,
      password: hash,
    },
  });

  //Redirect the user to signin, if its registered
  return { success: true };
};
