import type { Metadata } from 'next';
import { AccountView } from '@/components/shop/account-view';

export const metadata: Metadata = { title: 'Account · Shop' };

export default function AccountPage() {
  return <AccountView />;
}
