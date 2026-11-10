import { Download } from "lucide-react";

/**
 * Markdown export link. A plain anchor (not next/link) so the browser handles
 * the `content-disposition: attachment` response as a file download.
 */
export function ExportMarkdownButton({ scriptId }: { scriptId: string }) {
  return (
    <a
      href={`/api/studio/scripts/${scriptId}/export`}
      download
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
    >
      <Download className="h-4 w-4" />
      Xuất Markdown
    </a>
  );
}
