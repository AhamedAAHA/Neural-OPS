"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface JsonViewerProps {
  data: unknown;
  height?: string;
  readOnly?: boolean;
}

export function JsonViewer({ data, height = "200px", readOnly = true }: JsonViewerProps) {
  const value = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-500/15">
      <MonacoEditor
        height={height}
        language="json"
        theme="vs-dark"
        value={value}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          lineNumbers: "off",
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          renderLineHighlight: "none",
        }}
      />
    </div>
  );
}
