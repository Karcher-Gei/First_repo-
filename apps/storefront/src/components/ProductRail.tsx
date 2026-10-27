'use client';

import { Children, useRef, type ReactNode } from 'react';

/** Horizontal, swipeable row of product cards with previous/next buttons on larger screens. */
export function ProductRail({ children, label }: { children: ReactNode; label: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    listRef.current?.scrollBy({
      left: direction * listRef.current.clientWidth * 0.9,
      behavior: 'smooth',
    });

  // Four cards fit on a large screen; the arrows are only useful beyond that.
  const scrollable = Children.count(children) > 4;

  return (
    <div className="relative">
      <div
        ref={listRef}
        role="region"
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&>*]:w-[46%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[31%] lg:[&>*]:w-[23.5%]"
      >
        {children}
      </div>
      {(scrollable ? (['prev', 'next'] as const) : []).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => scroll(side === 'prev' ? -1 : 1)}
          aria-label={side === 'prev' ? 'Produits précédents' : 'Produits suivants'}
          className={`absolute top-1/3 hidden size-11 items-center justify-center rounded-full bg-surface text-xl shadow-lg ring-1 ring-line hover:bg-brand md:flex ${
            side === 'prev' ? '-left-5' : '-right-5'
          }`}
        >
          {side === 'prev' ? '←' : '→'}
        </button>
      ))}
    </div>
  );
}
