'use client';

import { cn } from '@karcher/ui';
import Image from 'next/image';
import { useState } from 'react';

/** Main product image with thumbnails to switch between the product's images. */
export function ProductGallery({ images, alt }: { images: { preview: string }[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const main = images[current];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-stage">
        {main ? (
          <Image
            src={`${main.preview}?preset=large`}
            alt={alt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain p-8 mix-blend-multiply md:p-12"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-4xl font-black uppercase text-line"
          >
            Kärcher
          </span>
        )}
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Images du produit">
          {images.map((image, index) => (
            <li key={image.preview} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Image ${index + 1} sur ${images.length}`}
                aria-pressed={index === current}
                className={cn(
                  'relative block size-20 overflow-hidden rounded-card border-2 bg-stage',
                  index === current ? 'border-ink' : 'border-line hover:border-ink-muted',
                )}
              >
                <Image
                  src={`${image.preview}?preset=thumb`}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-1.5 mix-blend-multiply"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
