import { useState } from 'react';
import type { Health } from '../../shared/api';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { PageHeader } from '@/components/kit/page-header';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApi } from '@/lib/api';
import { type Scheme, useScheme } from '@/lib/color-scheme';

const SCHEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: Scheme; label: string }[];

export function Settings() {
  const [scheme, setScheme] = useScheme();
  const [digest, setDigest] = useState(true);
  const [mentions, setMentions] = useState(true);
  const health = useApi<Health>('/api/health');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeader title="Settings" />
      <ListGroup title="Appearance">
        <ListRow title="Theme" trailing={<SegmentedControl aria-label="Theme" segments={SCHEMES} value={scheme} onChange={setScheme} className="w-60" />} />
      </ListGroup>
      {/* Kept in this page's state, so they reset on reload: wire them to the API when there is one. */}
      <ListGroup title="Email" footnote="Sample settings: they reset when the page reloads.">
        <ListRow title="Weekly digest" subtitle="A summary every Monday" trailing={<Switch checked={digest} onCheckedChange={setDigest} aria-label="Weekly digest" />} />
        <ListRow title="Mentions" subtitle="When someone mentions you" trailing={<Switch checked={mentions} onCheckedChange={setMentions} aria-label="Mentions" />} />
      </ListGroup>
      <ListGroup title="About">
        <ListRow
          title="API"
          subtitle="GET /api/health"
          trailing={
            <Badge variant="outline">{health.loading ? 'Checking…' : health.data?.ready ? 'Ready' : 'Not ready'}</Badge>
          }
        />
      </ListGroup>
    </div>
  );
}
