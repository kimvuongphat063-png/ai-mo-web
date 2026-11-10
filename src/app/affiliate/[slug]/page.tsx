import { notFound } from "next/navigation";
import { DetailPage } from "@/components/detail-page";
import { findCmsProduct, toStoreProduct } from "@/lib/cms";
import type { Product } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await findCmsProduct(slug);
  if (!item || item.kind !== "affiliate") notFound();
  return <DetailPage product={toStoreProduct(item) as Product} />;
}
