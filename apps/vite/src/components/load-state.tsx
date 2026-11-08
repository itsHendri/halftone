import { CircleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/kit/spinner';

/** While an /api request is out, or when it failed: one spinner, or what went wrong and a way to try again. */
export function LoadState({ error, retry, what }: { error?: string; retry: () => void; what: string }) {
  if (!error) {
    return (
      <div className="flex justify-center py-12">
        <Spinner aria-label={`Loading ${what}`} />
      </div>
    );
  }
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>Couldn't load {what}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={retry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
