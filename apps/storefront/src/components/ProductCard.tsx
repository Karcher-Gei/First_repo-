import { Price } from '@karcher/ui';
import Image from 'next/image';
import Link from 'next/link';

import { productHref } from '@/lib/paths';
import type { VariantSummary } from '@/lib/queries';

export function ProductCard({ variant }: { variant: VariantSummary }) {
  const { product } = variant;
  const href = productHref(product);
  if (!href) {
    return null;
  }
  return (
    <article className="flex flex-col rounded-card border border-line bg-surface p-4">
      <Link href={href} className="flex flex-1 flex-col gap-3">
        {product.featuredAsset ? (
          <Image
            src={`${product.featuredAsset.preview}?preset=medium`}
            alt={product.name}
            width={300}
            height={300}
            className="mx-auto aspect-square object-contain"
          />
        ) : null}
        <h3 className="text-sm font-semibold">{product.name}</h3>
      </Link>
      <Price value={variant.priceWithTax} />
    </article>
  );
}
