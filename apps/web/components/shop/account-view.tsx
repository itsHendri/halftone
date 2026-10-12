'use client';
import { BellIcon, CreditCardIcon, MapPinIcon } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { IconCircle } from '@/components/kit/icon-circle';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

export function AccountView() {
  const [promos, setPromos] = React.useState(false);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">Jane Doe</h1>
          <p className="text-muted-foreground text-sm">jane@example.com</p>
        </div>
      </div>
      <ListGroup title="Account">
        <ListRow leading={<IconCircle as={MapPinIcon} />} title="Addresses" subtitle="12 Orchard Lane, Cape Town" chevron onClick={() => toast('Not part of the sample')} />
        <ListRow leading={<IconCircle as={CreditCardIcon} />} title="Payment methods" subtitle="Visa ending 4242" chevron onClick={() => toast('Not part of the sample')} />
        <ListRow leading={<IconCircle as={BellIcon} />} title="Promotions" subtitle="Occasional offers by email" trailing={<Switch aria-label="Promotions" checked={promos} onCheckedChange={setPromos} />} />
      </ListGroup>
    </div>
  );
}
