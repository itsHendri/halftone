import { useState } from 'react';
import type { Project, ProjectStatus } from '../../shared/api';
import { LoadState } from '@/components/load-state';
import { DataTable } from '@/components/kit/data-table';
import { PageHeader } from '@/components/kit/page-header';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api';

type Filter = 'All' | ProjectStatus;
const FILTERS = (['All', 'Active', 'Paused', 'Done'] as const).map((value) => ({ value, label: value }));
// The status colour is a dot; the label stays in the badge's own text colour, so it keeps its contrast.
const DOT: Record<ProjectStatus, string> = { Active: 'bg-success', Paused: 'bg-warning', Done: 'bg-muted-foreground' };
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function Projects() {
  const { data, error, loading, retry } = useApi<Project[]>('/api/projects');
  const [filter, setFilter] = useState<Filter>('All');
  const rows = (data ?? []).filter((p) => filter === 'All' || p.status === filter);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Projects" description="Everything your team is working on." />
      {loading || !data ? (
        <LoadState error={error} retry={retry} what="projects" />
      ) : (
        <div className="flex flex-col gap-4">
          <SegmentedControl aria-label="Show" segments={FILTERS} value={filter} onChange={setFilter} className="w-full sm:w-80" />
          <DataTable
            caption={`${rows.length} of ${data.length} projects`}
            emptyTitle={`No ${filter.toLowerCase()} projects`}
            rows={rows}
            rowKey={(p) => p.id}
            columns={[
              { key: 'name', header: 'Project', sortValue: (p) => p.name, cell: (p) => <span className="font-medium">{p.name}</span> },
              { key: 'owner', header: 'Owner', sortValue: (p) => p.owner },
              {
                key: 'status',
                header: 'Status',
                sortValue: (p) => p.status,
                cell: (p) => (
                  <Badge variant="outline" className="gap-1.5">
                    <span aria-hidden className={`size-1.5 rounded-full ${DOT[p.status]}`} />
                    {p.status}
                  </Badge>
                ),
              },
              { key: 'openTasks', header: 'Open tasks', align: 'right', sortValue: (p) => p.openTasks, cell: (p) => <span className="tabular-nums">{p.openTasks}</span> },
              { key: 'updated', header: 'Updated', align: 'right', sortValue: (p) => p.updated, cell: (p) => date(p.updated) },
            ]}
          />
        </div>
      )}
    </div>
  );
}
