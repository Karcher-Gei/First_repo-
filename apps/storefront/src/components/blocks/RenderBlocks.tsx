import { RichText } from '@payloadcms/richtext-lexical/react';
import Image from 'next/image';
import Link from 'next/link';

import { ProductCard } from '@/components/ProductCard';
import { mediaOf } from '@/lib/cms';
import { COLLECTION_BY_SLUG } from '@/lib/queries';
import { shopQuery } from '@/lib/vendure';
import type {
  BannerBlock,
  HeroSliderBlock,
  Homepage,
  ProductCarouselBlock,
  RichTextBlock,
} from '@/payload-types';

type Block = NonNullable<Homepage['layout']>[number];

/** Renders the homepage blocks staff arrange in the CMS. */
export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-12">
      {blocks.map(block => {
        switch (block.blockType) {
          case 'heroSlider':
            return <HeroSlider key={block.id} block={block} />;
          case 'productCarousel':
            return <ProductCarousel key={block.id} block={block} />;
          case 'banner':
            return <Banner key={block.id} block={block} />;
          case 'richText':
            return <RichTextSection key={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

/** CSS scroll-snap slider: no client JavaScript, so it never delays the page. */
function HeroSlider({ block }: { block: HeroSliderBlock }) {
  return (
    <section aria-label="À la une" className="flex snap-x snap-mandatory overflow-x-auto rounded-card">
      {(block.slides ?? []).map((slide, index) => {
        const image = mediaOf(slide.image);
        if (!image?.url) {
          return null;
        }
        const picture = (
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width ?? 1920}
            height={image.height ?? 600}
            priority={index === 0}
            className="h-auto w-full"
          />
        );
        return (
          <div key={slide.id ?? index} className="w-full flex-none snap-start">
            {slide.link ? <Link href={slide.link}>{picture}</Link> : picture}
          </div>
        );
      })}
    </section>
  );
}

async function ProductCarousel({ block }: { block: ProductCarouselBlock }) {
  const { collection } = await shopQuery(COLLECTION_BY_SLUG, {
    slug: block.collectionSlug,
    take: block.limit ?? 6,
  });
  const variants = collection?.productVariants.items ?? [];
  if (variants.length === 0) {
    return null;
  }
  return (
    <section>
      <h2 className="mb-4 text-xl font-black uppercase">{block.title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {variants.map(variant => (
          <ProductCard key={variant.id} product={variant.product} priceWithTax={variant.priceWithTax} />
        ))}
      </div>
    </section>
  );
}

function Banner({ block }: { block: BannerBlock }) {
  const image = mediaOf(block.image);
  if (!image?.url) {
    return null;
  }
  const picture = (
    <Image src={image.url} alt={image.alt} width={image.width ?? 1440} height={image.height ?? 400} className="h-auto w-full rounded-card" />
  );
  return <section>{block.link ? <Link href={block.link}>{picture}</Link> : picture}</section>;
}

function RichTextSection({ block }: { block: RichTextBlock }) {
  return (
    <section className="space-y-4 leading-relaxed">
      <RichText data={block.content} />
    </section>
  );
}
