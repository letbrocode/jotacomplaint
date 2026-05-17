


import { redirect } from "next/navigation";
import React from "react";
import Signin from "~/components/ui/signin";
import { auth } from "~/server/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | JotaComplaint",
  description: "Sign in to your JotaComplaint account.",
};

const Page = async () => {
  const serverSession = await auth();
  if (serverSession?.user) {
    redirect("/dashboard");
  }
  return (
    <>
      <Signin />
    </>
  );
};

export default Page;
