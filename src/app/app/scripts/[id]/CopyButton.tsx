"use client";

import { useState } from "react";
import { Button } from "@/components/studio/ui";
import { Copy, Check } from "lucide-react";

type Props = {
  text: string;
};

export function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Sao chép
        </>
      )}
    </Button>
  );
}
