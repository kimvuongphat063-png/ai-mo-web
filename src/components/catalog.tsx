import type { Product } from "@/lib/store";
import { getStoreProducts } from "@/lib/cms";
import { CatalogClientView } from "./catalog-client-view";

export async function CatalogPage({
  title,
  eyebrow,
  intro,
  filter,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  filter: (p: Product) => boolean;
}) {
  const all = (await getStoreProducts()) as Product[];
  const list = all.filter(filter);

  return (
    <main id="main-content" className="pb-20">
      <section className="catalog-hero container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="catalog-stats">
          <b>{list.length.toString().padStart(2, "0")}</b>
          <span>
            sản phẩm được
            <br />
            chọn lọc kỹ
          </span>
        </div>
      </section>

      <CatalogClientView initialProducts={list} />
    </main>
  );
}
