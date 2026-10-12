import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PRODUCTS, productById } from '@/components/shop/data';
import { ProductView } from '@/components/shop/product-view';

export const generateStaticParams = () => PRODUCTS.map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: PageProps<'/shop/product/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: `${productById(id)?.name ?? 'Product'} · Shop` };
}

export default async function ProductPage({ params }: PageProps<'/shop/product/[id]'>) {
  const { id } = await params;
  const product = productById(id);
  if (!product) notFound();
  return <ProductView product={product} />;
}
