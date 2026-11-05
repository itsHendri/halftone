import type { Metadata } from 'next';
import { StudioPage } from '@/components/theme/studio';

export const metadata: Metadata = {
  title: 'Components · Studio',
  description: 'Every component in both kits, live on the design system you are editing.',
};

export default function StudioComponents() {
  return <StudioPage page="components" />;
}
