"use client";

import { signOut } from "next-auth/react";
import { PiSignOutLight } from "react-icons/pi";

const Signout = () => {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium"
    >
      <PiSignOutLight className="h-5 w-5" />
      <span>Sign out</span>
    </button>
  );
};

export default Signout;
