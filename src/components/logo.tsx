import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-ink">✦</span>
      <span>Brief<span className="text-brand-2">AI</span></span>
    </Link>
  );
}
