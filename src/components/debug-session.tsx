"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function DebugSession() {
    const { data: session, status } = useSession();
    const [debugInfo, setDebugInfo] = useState<unknown>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Fetch debug info from API
        fetch("/api/debug-session")
            .then((res) => res.json())
            .then((data) => setDebugInfo(data))
            .catch((err) => console.error("Debug fetch error:", err));
    }, []);

    // Don't render on server-side  
    if (!mounted) {
        return null;
    }

    return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        zIndex: 9999,
        fontSize: "12px",
        maxWidth: "300px",
        maxHeight: "200px",
        overflow: "auto",
      }}
    >
      <h4>Session Debug</h4>
      <div>Status: {status}</div>
      <div>Has Session: {session ? "Yes" : "No"}</div>
      {session && (
        <>
          <div>User ID: {session.user?.id || "undefined"}</div>
          <div>User Email: {session.user?.email}</div>
          <div>User Name: {session.user?.name}</div>
        </>
      )}

      <h5>Server Debug:</h5>
      {debugInfo ? (
        <pre style={{ fontSize: "10px" }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
