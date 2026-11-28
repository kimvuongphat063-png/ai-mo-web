import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/detail-page";
import { findCmsProduct, toStoreProduct } from "@/lib/cms";
import type { Product } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await findCmsProduct(slug);
  if (!item) {
    return { title: "Không tìm thấy công cụ — AI MỞ" };
  }
  const product = toStoreProduct(item) as Product;
  return {
    title: `${product.name} — ${product.category} | AI MỞ`,
    description: product.description,
    alternates: {
      canonical: `https://heyaimo.com/tools/${product.slug}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await findCmsProduct(slug);
  if (!item) notFound();
  return <DetailPage product={toStoreProduct(item) as Product} />;
}
