'use client';
import { SearchXIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { EmptyState } from '@/components/kit/empty-state';
import { FilterChip, FilterChipRow } from '@/components/kit/filter-chip';
import { ImageTile } from '@/components/kit/image-tile';
import { SearchField } from '@/components/kit/search-field';
import { Button } from '@/components/ui/button';
import { CATEGORIES, iconFor, money, PRODUCTS } from './data';

export function Browse() {
  const [query, setQuery] = React.useState('');
  const [cat, setCat] = React.useState<(typeof CATEGORIES)[number]['value']>('all');
  const items = PRODUCTS.filter((p) => (cat === 'all' || p.category === cat) && p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Things for your desk and home</h1>
        <SearchField aria-label="Search products" placeholder="Search products" value={query} onChangeText={setQuery} containerClassName="sm:w-72" />
      </div>
      <FilterChipRow>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.value} label={c.label} selected={cat === c.value} onClick={() => setCat(c.value)} />
        ))}
      </FilterChipRow>
      {items.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/shop/product/${p.id}`} className="group focus-visible:ring-ring/50 flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-[3px]">
                <ImageTile seed={p.seed} fallbackIcon={iconFor(p)} ratio={1} className="transition-opacity group-hover:opacity-90" />
                <span className="truncate font-medium">{p.name}</span>
                <span className="flex items-center justify-between">
                  <span className="font-semibold tabular-nums">{money(p.price)}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <StarIcon className="fill-warning text-warning size-3" aria-hidden />
                    <span className="sr-only">Rated</span> {p.rating}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={SearchXIcon}
          title="Nothing matches"
          description="Try another word or clear the filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setCat('all');
              }}>
              Clear search
            </Button>
          }
        />
      )}
    </>
  );
}
