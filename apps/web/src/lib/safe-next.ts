/** A `next` path to go to. Same-origin only: "https://…", "//…" and "/\…" would leave Unigym. */
export function safeNext(next: string | null) {
  if (!next?.startsWith("/")) return "/";
  const { origin } = window.location;
  return new URL(next, origin).origin === origin ? next : "/";
}
