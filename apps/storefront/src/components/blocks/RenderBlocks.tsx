import { RichText } from '@payloadcms/richtext-lexical/react';
import Image from 'next/image';
import Link from 'next/link';

import { Container, CtaLink, SectionHeading } from '@/components/brand';
import {
  HomeAfterSales,
  HomeCategories,
  HomeHero,
  HomeProBanner,
  HomeUniverses,
} from '@/components/home/sections';
import { ProductCard } from '@/components/ProductCard';
import { ProductRail } from '@/components/ProductRail';
import { ServiceHighlights } from '@/components/ServiceHighlights';
import { featuredProducts, rankedProducts, type CategoryProduct } from '@/lib/catalog';
import { mediaOf } from '@/lib/cms';
import { categoryHref } from '@/lib/paths';
import { COLLECTION_BY_SLUG } from '@/lib/queries';
import { SITE_NAME } from '@/lib/site';
import { shopQuery } from '@/lib/vendure';
import type {
  BannerBlock,
  HeroSliderBlock,
  Homepage,
  ProductCarouselBlock,
  RichTextBlock,
} from '@/payload-types';

export type Block = NonNullable<Homepage['layout']>[number];

/** The homepage while the CMS has no blocks; the PrestaShop import builds its layout from it. */
export const DEFAULT_HOMEPAGE: Block[] = [
  { blockType: 'homeHero' },
  { blockType: 'universes' },
  { blockType: 'categoryGrid' },
  { blockType: 'productCarousel', title: 'Notre sélection', source: 'catalog', limit: 12 },
  { blockType: 'proBanner' },
  { blockType: 'services' },
  { blockType: 'afterSales' },
];

/** Renders the homepage blocks staff arrange in the CMS. */
export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  // The Kärcher hero holds the page's h1; an imported slider has no heading.
  const hasHeading = blocks.some((block) => block.blockType === 'homeHero');
  return (
    <div className="-mt-6 space-y-16 md:-mt-8 md:space-y-20">
      {hasHeading ? null : <h1 className="sr-only">{SITE_NAME}</h1>}
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;
        switch (block.blockType) {
          case 'homeHero':
            return <HomeHero key={key} heading={block.heading} text={block.text} />;
          case 'universes':
            return <HomeUniverses key={key} />;
          case 'categoryGrid':
            return <HomeCategories key={key} title={block.title} />;
          case 'proBanner':
            return <HomeProBanner key={key} />;
          case 'services':
            return <ServiceHighlights key={key} />;
          case 'afterSales':
            return <HomeAfterSales key={key} />;
          case 'heroSlider':
            return <HeroSlider key={key} block={block} />;
          case 'productCarousel':
            return <ProductCarousel key={key} block={block} />;
          case 'banner':
            return <Banner key={key} block={block} />;
          case 'richText':
            return <RichTextSection key={key} block={block} />;
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

/** Products of a carousel, from a collection, the best sellers, the newest or the whole catalog. */
async function carouselProducts(
  block: ProductCarouselBlock,
): Promise<{ products: CategoryProduct[]; href: string | null }> {
  const limit = block.limit ?? 8;
  switch (block.source) {
    case 'best-sellers':
      return {
        products: (await rankedProducts('best-selling', 1)).products.slice(0, limit),
        href: '/meilleures-ventes',
      };
    case 'newest':
      return {
        products: (await rankedProducts('newest', 1)).products.slice(0, limit),
        href: '/nouveaux-produits',
      };
    case 'catalog':
      return { products: await featuredProducts(limit), href: null };
    default: {
      if (!block.collectionSlug) {
        return { products: [], href: null };
      }
      const { collection } = await shopQuery(COLLECTION_BY_SLUG, {
        slug: block.collectionSlug,
        take: limit * 3,
      });
      const variants = uniqueProducts(collection?.productVariants.items ?? []).slice(0, limit);
      return {
        products: variants.map((v) => ({
          product: v.product,
          priceWithTax: v.priceWithTax,
          from: false,
        })),
        href: collection ? categoryHref(collection) : null,
      };
    }
  }
}

async function ProductCarousel({ block }: { block: ProductCarouselBlock }) {
  const { products, href } = await carouselProducts(block);
  if (products.length === 0) {
    return null;
  }
  const link = block.link || href;
  return (
    <section>
      <SectionHeading
        title={block.title}
        action={link ? { href: link, label: 'Tout voir' } : undefined}
      />
      <ProductRail label={block.title}>
        {products.map(({ product, priceWithTax, from }) => (
          <ProductCard
            key={product.id}
            product={product}
            priceWithTax={priceWithTax}
            priceFrom={from}
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
