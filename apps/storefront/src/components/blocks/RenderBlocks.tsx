import { RichText } from '@payloadcms/richtext-lexical/react';
import Image from 'next/image';
import Link from 'next/link';

import { Container, CtaLink, SectionHeading } from '@/components/brand';
import { ProductCard } from '@/components/ProductCard';
import { ProductRail } from '@/components/ProductRail';
import { mediaOf } from '@/lib/cms';
import { categoryHref } from '@/lib/paths';
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
    <div className="-mt-6 space-y-16 md:-mt-8 md:space-y-20">
      {blocks.map((block) => {
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

/** CSS scroll-snap slider across the full width: no client JavaScript, so it never delays the page. */
function HeroSlider({ block }: { block: HeroSliderBlock }) {
  return (
    <section
      aria-label="À la une"
      className="full-bleed flex snap-x snap-mandatory overflow-x-auto bg-anthracite [scrollbar-width:none]"
    >
      {(block.slides ?? []).map((slide, index) => {
        const image = mediaOf(slide.image);
        if (!image?.url) {
          return null;
        }
        return (
          <div key={slide.id ?? index} className="relative w-full flex-none snap-start">
            <Image
              src={image.url}
              alt={slide.heading ? '' : image.alt}
              width={image.width ?? 1920}
              height={image.height ?? 600}
              priority={index === 0}
              sizes="100vw"
              className="h-auto max-h-[36rem] w-full object-cover"
            />
            {slide.heading ? (
              <div className="absolute inset-0 flex items-center bg-gradient-to-r from-ink/80 via-ink/40 to-transparent">
                <Container className="space-y-5">
                  <p className="max-w-xl font-heading text-4xl font-extrabold uppercase leading-[0.95] text-white md:text-6xl">
                    {slide.heading}
                  </p>
                  {slide.link ? <CtaLink href={slide.link}>Découvrir</CtaLink> : null}
                </Container>
              </div>
            ) : slide.link ? (
              <Link href={slide.link} className="absolute inset-0" aria-label={image.alt} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

/** One card per product: a collection lists variants, so a product with versions appears once. */
function uniqueProducts<T extends { product: { id: string } }>(variants: T[]): T[] {
  const seen = new Set<string>();
  return variants.filter((v) => !seen.has(v.product.id) && (seen.add(v.product.id), true));
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
  const href = collection ? categoryHref(collection) : null;
  return (
    <section>
      <SectionHeading
        title={block.title}
        action={href ? { href, label: 'Tout voir' } : undefined}
      />
      <ProductRail label={block.title}>
        {uniqueProducts(variants).map((variant) => (
          <ProductCard
            key={variant.product.id}
            product={variant.product}
            priceWithTax={variant.priceWithTax}
          />
        ))}
      </ProductRail>
    </section>
  );
}

function Banner({ block }: { block: BannerBlock }) {
  const image = mediaOf(block.image);
  if (!image?.url) {
    return null;
  }
  const picture = (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width ?? 1440}
      height={image.height ?? 400}
      className="h-auto w-full rounded-card"
    />
  );
  return <section>{block.link ? <Link href={block.link}>{picture}</Link> : picture}</section>;
}

function RichTextSection({ block }: { block: RichTextBlock }) {
  return (
    <section className="rich-text mx-auto max-w-3xl">
      <RichText data={block.content} />
    </section>
  );
}
