import { Price } from '@karcher/ui';
import Image from 'next/image';
import Link from 'next/link';

import { productHref } from '@/lib/paths';
import type { ProductSummary } from '@/lib/queries';

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
  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-surface p-3 transition-shadow hover:shadow-md sm:p-4">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-card bg-surface-muted">
        {product.featuredAsset ? (
          <Image
            src={`${product.featuredAsset.preview}?preset=medium`}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-2 transition-transform group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-2xl font-black uppercase text-line"
          >
            Kärcher
          </span>
        )}
      </div>
      <h3 className="flex-1 text-sm font-semibold leading-snug">
        {/* The link covers the whole card; the title is its accessible name. */}
        <Link href={href} className="after:absolute after:inset-0 group-hover:underline">
          {product.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm">
        {priceFrom ? <span className="text-ink-muted">À partir de </span> : null}
        <Price value={priceWithTax} />
      </p>
    </article>
  );
}
