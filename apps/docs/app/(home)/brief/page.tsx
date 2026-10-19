import type { Metadata } from 'next';
import { BriefWizard } from '@/components/brief/wizard';
import { kit } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Start a prototype',
  description: `Answer a guided brief or paste a transcript, then hand ${kit.name} one prompt: your agent sets up the kit, plans the screens, and waits for your go-ahead before writing code.`,
};

export default function BriefPage() {
  return <BriefWizard />;
}
