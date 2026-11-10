import type { Product } from "@/lib/store";
import { getStoreProducts } from "@/lib/cms";
import { ProductCard } from "./product-ui";

export async function CatalogPage({ title, eyebrow, intro, filter }: { title: string; eyebrow: string; intro: string; filter: (p: Product) => boolean }) {
  const list = (await getStoreProducts() as Product[]).filter(filter);
  return <main><section className="catalog-hero container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p><div className="catalog-stats"><b>{list.length.toString().padStart(2,"0")}</b><span>sản phẩm được<br/>chọn lọc kỹ</span></div></section><section className="container product-grid">{list.map((p, i) => <ProductCard key={p.id} product={p} index={i}/>)}</section></main>;
}
