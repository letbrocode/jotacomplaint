"use server";

import { redirect } from "next/navigation";
import React from "react";
import Signin from "~/components/ui/signin";
import { auth } from "~/server/auth";

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
