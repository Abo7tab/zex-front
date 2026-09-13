"use client";

import React from "react";

interface State {
  hasError: boolean;
  error: string;
  stack: string;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "", stack: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error: error?.message || String(error),
      stack: error?.stack || "",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0f172a",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            fontFamily: "monospace",
            direction: "ltr",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #ef4444",
              borderRadius: 16,
              padding: 32,
              maxWidth: 800,
              width: "100%",
            }}
          >
            <div style={{ color: "#ef4444", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              🚨 RUNTIME ERROR — ZEX DASHBOARD
            </div>
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: 16,
                fontSize: 13,
                color: "#fca5a5",
                wordBreak: "break-all",
                marginBottom: 16,
              }}
            >
              <strong>Error:</strong> {this.state.error}
            </div>
            <details style={{ cursor: "pointer" }}>
              <summary style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>
                Stack Trace (click to expand)
              </summary>
              <pre
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 11,
                  color: "#cbd5e1",
                  overflow: "auto",
                  maxHeight: 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {this.state.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 24,
                padding: "10px 24px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
