import type { Metadata } from 'next';
import { Studio } from '@/components/theme/studio';
import { kit } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Studio',
  description: `Make and keep design systems for the ${kit.name} kits: colour, type, corners, depth and controls, live on both kits, saved in your browser, then applied with one code or a .halftone.json.`,
};

export default function StudioPage() {
  return <Studio />;
}
