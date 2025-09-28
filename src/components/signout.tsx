"use client";

import { signOut } from "next-auth/react";
import { PiSignOutLight } from "react-icons/pi";

const Signout = () => {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="hover:bg-accent flex items-center justify-center rounded-md p-2"
    >
      <PiSignOutLight className="h-5 w-5" />
    </button>
  );
};

export default Signout;
