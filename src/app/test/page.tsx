"use client";

import { useSession } from "next-auth/react";

export default function TestPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-8 bg-white text-black">Loading...</div>;
  }

  return (
    <div className="p-8 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-4">
        <p>Status: {status}</p>
        <p>Session exists: {session ? "Yes" : "No"}</p>
        {session && (
          <div>
            <p>User: {session.user?.email}</p>
            <p>Name: {session.user?.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}