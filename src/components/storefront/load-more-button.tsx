import Link from "next/link";

export function LoadMoreButton({
  href,
  hasMore,
}: {
  href: string;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <Link href={href} className="btn-secondary mx-auto">
      Ver más
    </Link>
  );
}
