import { Price } from '@karcher/ui';
import Image from 'next/image';
import Link from 'next/link';

import { productHref } from '@/lib/paths';
import type { ProductSummary } from '@/lib/queries';
import { productSale } from '@/lib/sale';

/** Product tile: image on the grey stage, name, price; the whole tile links to the product. */
export function ProductCard({
  product,
  priceWithTax,
  priceFrom = false,
}: {
  product: ProductSummary;
  priceWithTax: number;
  /** The product's variants have different prices; `priceWithTax` is the lowest. */
  priceFrom?: boolean;
}) {
  const href = productHref(product);
  if (!href) {
    return null;
  }
  const sale = productSale(product.variants, priceWithTax);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card bg-surface ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-ink/20">
      <div className="relative aspect-square bg-stage">
        {product.featuredAsset ? (
          <Image
            src={`${product.featuredAsset.preview}?preset=medium`}
            alt={product.featuredAsset.customFields?.alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-5 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-extrabold uppercase text-line"
          >
            Kärcher
          </span>
        )}
        {priceFrom ? (
          <span className="absolute left-3 top-3 rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold shadow-sm">
            Plusieurs versions
          </span>
        ) : null}
        {sale.percent > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-danger px-2.5 py-0.5 text-sm font-bold text-white">
            -{sale.percent} %
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="flex-1 font-semibold leading-snug">
          {/* The link covers the whole card; the title is its accessible name. */}
          <Link href={href} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-end justify-between gap-2">
          <p className="text-lg leading-tight">
            {priceFrom ? <span className="block text-xs text-ink-muted">À partir de</span> : null}
            <Price value={priceWithTax} previous={sale.regularPrice} />
          </p>
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-lg transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </div>
      </div>
    </article>
  );
}
