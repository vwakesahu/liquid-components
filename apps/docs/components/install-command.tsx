"use client";

import { useState } from "react";

export function InstallCommand({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const command = `bunx --bun shadcn@latest add <owner>/<repo>/${name}`;

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="install-command">
      <code>{command}</code>
      <button type="button" onClick={copy} aria-label="Copy installation command">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
