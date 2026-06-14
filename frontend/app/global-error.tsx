"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // global-error replaces the root layout, so it must render its own html/body
  // and cannot rely on the app's design tokens being applied via the layout.
  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff9f0",
          color: "#1e2022",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#a8362b",
              fontWeight: 700,
            }}
          >
            Error
          </p>
          <h1 style={{ margin: "12px 0", fontSize: "28px", fontWeight: 800 }}>
            Algo salio mal.
          </h1>
          <p style={{ margin: "0 0 24px", color: "#5b554e", lineHeight: 1.6 }}>
            Ocurrio un problema inesperado. Reintenta en unos segundos.
          </p>
          <button
            onClick={() => reset()}
            type="button"
            style={{
              border: "none",
              borderRadius: "10px",
              background: "#8c4b26",
              color: "#fff9f0",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
