import { CompassIcon } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/kit/empty-state';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <EmptyState
      icon={CompassIcon}
      title="There's no page here"
      description="The link may be old, or the page has moved."
      action={
        <Button asChild>
          <Link to="/">Back to the overview</Link>
        </Button>
      }
    />
  );
}
