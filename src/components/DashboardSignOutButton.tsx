"use client";

import { signOut } from "next-auth/react";

export default function DashboardSignOutButton({
  className,
}: {
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className}
    >
      Terminar sessão
    </button>
  );
}
