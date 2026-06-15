"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Erreur critique</h2>
            <p style={{ marginTop: "0.5rem", color: "#666" }}>{error.message}</p>
            <button
              style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#2563eb", color: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
              onClick={reset}
            >
              Recharger
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
