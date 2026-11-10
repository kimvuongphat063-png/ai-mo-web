const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
export function parseYouTubeId(value?: string) {
  if (!value) return null;
  if (youtubeIdPattern.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ?? null;
    }
    return id && youtubeIdPattern.test(id) ? id : null;
  } catch { return null; }
}
