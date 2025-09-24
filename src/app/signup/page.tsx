"use server";

import { redirect } from "next/navigation";
import React from "react";
import Signup from "~/components/ui/signup";
import { auth } from "~/server/auth";

const Page = async () => {
  const serverSession = await auth();
  if (serverSession?.user) {
    redirect("/dashboard");
  }
  return (
    <>
      <Signup />
    </>
  );
};

export default Page;
