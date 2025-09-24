"use client";
import Link from "next/link";
import { IoMdArrowBack } from "react-icons/io";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInSchema } from "~/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signup } from "~/app/actions/auth";

type FormValues = z.infer<typeof signInSchema>;

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(signInSchema) });

  const router = useRouter();
  const onSubmit = async (data: FormValues) => {
    const response = await signup(data.email, data.password);
    if (!response.success) {
      toast.error("Sign up failed", {
        description: response.error,
      });
    } else {
      toast.success("Sign up successful!", {
        description: "You can now sign in with your new account",
      });
    }
    setTimeout(() => {
      router.push("/signin");
    }, 1500);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link href="/" className="flex items-center gap-2">
          <IoMdArrowBack className="h-4 w-4" />
          <p className="leading-7">Go back</p>
        </Link>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your email and a password below to signup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="signin-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="mail@gmail.com"
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    {...register("password")}
                    id="password"
                    type="password"
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" form="signin-form" className="w-full">
              Sign Up
            </Button>
            <Link href="/signin">
              <Button variant="link">Already have an account?</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
