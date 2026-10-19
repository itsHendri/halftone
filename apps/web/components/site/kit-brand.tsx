'use client';
import { Logo } from '@/components/kit/logo';
import { useBrand } from '@/lib/brand-context';

/** The kit's own name until a brand is applied (lib/brand.ts); then the brand's logo. */
export function KitBrand() {
  const brand = useBrand();
  if (brand.logo) return <Logo size={22} />;
  return (
    <>
      <span aria-hidden className="bg-primary size-5 rounded-md" />
      <span className="hidden sm:inline">Halftone</span>
      <span className="sm:hidden">Kit</span>
    </>
  );
}
