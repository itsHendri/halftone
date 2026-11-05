import type { Metadata } from 'next';
import { StudioPage } from '@/components/theme/studio';

export const metadata: Metadata = {
  title: 'Accessibility · Studio',
  description: 'Every colour pairing in the design system you are editing, checked against WCAG AA.',
};

export default function StudioAccessibility() {
  return <StudioPage page="accessibility" />;
}
