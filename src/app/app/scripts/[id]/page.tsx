import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { getScript, getProduct } from "@/lib/studio";
import { PageHeader, Panel, Badge, Alert, SectionLabel } from "@/components/studio/ui";
import { Clock, Hash, MessageSquare, Camera, AlertTriangle, Sparkles } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { ExportMarkdownButton } from "./ExportMarkdownButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScriptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requirePageRole();
  const script = await getScript(session.userId, id);

  if (!script) {
    notFound();
  }

  // Try to load the product
  const product = await getProduct(session.userId, script.productProfileId);

  return (
    <>
      <PageHeader
        title={script.scripts[0]?.title || "Script"}
        description={
          product ? (
            <>
              Sản phẩm:{" "}
              <Link
                href={`/app/products/${product.id}`}
                className="text-accent transition-colors hover:underline"
              >
                {product.name}
              </Link>
            </>
          ) : undefined
        }
        backHref="/app/scripts"
        backLabel="Scripts"
        actions={<ExportMarkdownButton scriptId={script.id} />}
      />

      {/* Script Metadata */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Badge tone="accent" className="capitalize">
          {script.platform}
        </Badge>
        <span className="flex items-center gap-1.5 text-text-2">
          <Clock className="h-4 w-4" />
          {script.durationSeconds}s
        </span>
        <Badge tone="neutral" className="capitalize">
          {script.goal}
        </Badge>
      </div>

      {/* Script Variants */}
      <div className="space-y-6">
        {script.scripts.map((variant, variantIndex) => (
          <Panel
            key={variantIndex}
            title={
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Biến thể {variantIndex + 1}
                </span>
                <span className="text-xs text-muted">•</span>
                <span className="text-sm font-semibold text-text">
                  {variant.title}
                </span>
                <span className="text-xs text-muted">
                  • {variant.durationSeconds}s
                </span>
              </div>
            }
            actions={
              <CopyButton
                text={`${variant.title}\n\n${variant.shots
                  .map(
                    (s) =>
                      `[${s.startSecond}s-${s.endSecond}s] ${s.spokenText || s.visualDirection}`
                  )
                  .join("\n\n")}\n\n${variant.caption}\n\n${variant.hashtags.join(" ")}`}
              />
            }
          >
            <div className="space-y-0 divide-y divide-border">
              {/* Angle & Hook */}
              {(variant.angle || variant.hook) && (
                <div className="p-6">
                  {variant.angle && (
                    <p className="mb-2 text-sm text-text-2">
                      <span className="font-medium">Góc bán hàng:</span>{" "}
                      {variant.angle}
                    </p>
                  )}
                  {variant.hook && (
                    <p className="text-sm font-medium text-accent">
                      Hook: &quot;{variant.hook}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Shots Timeline */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-accent" />
                  <SectionLabel>
                    Shot Breakdown ({variant.shots.length} shots)
                  </SectionLabel>
                </div>
                <div className="space-y-4">
                  {variant.shots.map((shot, shotIndex) => (
                    <div
                      key={shotIndex}
                      className="flex gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
                    >
                      {/* Timeline marker */}
                      <div className="shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle">
                          <span className="text-sm font-medium text-accent">
                            {shotIndex + 1}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-col items-center">
                          <span className="text-xs text-muted">
                            {shot.startSecond}s
                          </span>
                          <div className="h-2 w-px bg-border" />
                          <span className="text-xs text-muted">
                            {shot.endSecond}s
                          </span>
                        </div>
                      </div>

                      {/* Shot content */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                            Purpose
                          </p>
                          <p className="text-sm text-text">{shot.purpose}</p>
                        </div>

                        {shot.spokenText && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                              Spoken Text
                            </p>
                            <p className="text-sm text-text">
                              &quot;{shot.spokenText}&quot;
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                            Visual Direction
                          </p>
                          <p className="text-sm text-text-2">
                            {shot.visualDirection}
                          </p>
                        </div>

                        {shot.onScreenText && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                              On-Screen Text
                            </p>
                            <p className="text-sm font-medium text-accent">
                              {shot.onScreenText}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted">
                          {shot.cameraAction && (
                            <span className="flex items-center gap-1.5">
                              <Camera className="h-3 w-3" />
                              {shot.cameraAction}
                            </span>
                          )}
                          {shot.bRoll && (
                            <span className="flex items-center gap-1.5">
                              B-Roll: {shot.bRoll}
                            </span>
                          )}
                        </div>

                        {shot.ctaLine && (
                          <div className="border-t border-border pt-2">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                              CTA
                            </p>
                            <p className="text-sm font-medium text-accent">
                              {shot.ctaLine}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption & Hashtags */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-accent" />
                      <SectionLabel>Caption</SectionLabel>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-text">
                      {variant.caption}
                    </p>
                  </div>

                  {variant.hashtags && variant.hashtags.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4 text-accent" />
                        <SectionLabel>Hashtags</SectionLabel>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variant.hashtags.map((tag, i) => (
                          <Badge key={i} tone="accent">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Hooks & Suggestions */}
              {((variant.alternativeHooks &&
                variant.alternativeHooks.length > 0) ||
                variant.audioSuggestion ||
                variant.disclosureNote ||
                variant.cta) && (
                <div className="space-y-4 bg-surface-2 p-6">
                  {variant.cta && (
                    <div>
                      <SectionLabel>Call to Action</SectionLabel>
                      <p className="mt-1 text-sm font-medium text-accent">
                        {variant.cta}
                      </p>
                    </div>
                  )}

                  {variant.alternativeHooks &&
                    variant.alternativeHooks.length > 0 && (
                      <div>
                        <SectionLabel>Alternative Hooks</SectionLabel>
                        <ul className="mt-2 space-y-1.5">
                          {variant.alternativeHooks.map((hook, i) => (
                            <li key={i} className="text-sm text-text">
                              • {hook}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {variant.audioSuggestion && (
                    <div>
                      <SectionLabel>Audio Suggestion</SectionLabel>
                      <p className="mt-1 text-sm text-text-2">
                        {variant.audioSuggestion}
                      </p>
                    </div>
                  )}

                  {variant.disclosureNote && (
                    <div>
                      <SectionLabel>Disclosure Note</SectionLabel>
                      <p className="mt-1 text-sm text-text-2">
                        {variant.disclosureNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {variant.warnings && variant.warnings.length > 0 && (
                <div className="p-6">
                  <Alert tone="warning" title="Cảnh báo tuân thủ">
                    <ul className="mt-2 space-y-1.5">
                      {variant.warnings.map((warning, i) => (
                        <li key={i} className="text-sm">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              )}
            </div>
          </Panel>
        ))}
      </div>

      {/* Script-Level Insights */}
      {((script.missingInformation && script.missingInformation.length > 0) ||
        (script.complianceNotes && script.complianceNotes.length > 0)) && (
        <Panel title="Generation Insights" className="mt-6">
          <div className="space-y-6 p-6">
            {script.missingInformation &&
              script.missingInformation.length > 0 && (
                <div>
                  <SectionLabel>Missing Information</SectionLabel>
                  <ul className="mt-3 space-y-2">
                    {script.missingInformation.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-text-2"
                      >
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {script.complianceNotes && script.complianceNotes.length > 0 && (
              <div>
                <SectionLabel>Compliance Notes</SectionLabel>
                <ul className="mt-3 space-y-2">
                  {script.complianceNotes.map((note, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-2"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
