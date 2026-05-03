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
import { type z } from "zod";
import { signInSchema } from "~/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type FormValues = z.infer<typeof signInSchema>;

function showRateLimitToast() {
  toast.error("Too many sign-in attempts", {
    description: "Please wait about a minute before trying again.",
  });
}

const Signin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = "/dashboard";
        return;
      }

      if (
        result?.status === 429 ||
        result?.error === "RateLimited" ||
        result?.url?.includes("error=RateLimited")
      ) {
        showRateLimitToast();
        return;
      }

      toast.error("Invalid credentials", {
        description: "Please check your email and password.",
      });
    } catch (error) {
      console.log(error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429") || message.includes("RateLimited")) {
        showRateLimitToast();
        return;
      }
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <IoMdArrowBack className="h-4 w-4" />
          <p className="leading-7">Go back</p>
        </Link>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password below to signin.
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
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 mr-1 flex h-full w-10 items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                  {error === "RateLimited" && (
                    <p className="text-sm text-red-500">
                      Too many sign-in attempts. Please wait about a minute.
                    </p>
                  )}
                  {error === "CredentialsSignin" && (
                    <p className="text-sm text-red-500">Invalid credentials</p>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              form="signin-form"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <Link href="/signup">
              <Button variant="link" disabled={isLoading}>
                Don&apos;t have an account?
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signin;
