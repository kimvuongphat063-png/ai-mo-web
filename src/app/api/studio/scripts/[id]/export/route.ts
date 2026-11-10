import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { getProduct, getScript } from "@/lib/studio";
import { scriptToMarkdown, scriptMarkdownFilename } from "@/lib/studio/markdown";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Download a saved script as Markdown. Ownership enforced via getScript(userId). */
export async function GET(_req: Request, { params }: Params) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const script = await getScript(auth.session.userId, id);
    if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

    const product = await getProduct(auth.session.userId, script.productProfileId);
    const markdown = scriptToMarkdown(script, product);

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${scriptMarkdownFilename(script)}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/studio/scripts/[id]/export]", err);
    return NextResponse.json({ error: "Không thể xuất kịch bản" }, { status: 500 });
  }
}
