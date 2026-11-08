import { HomeIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { Route, Routes } from 'react-router';
import { AppShell } from '@/components/kit/app-shell';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { PageHeader } from '@/components/kit/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

function Home() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Home" description="Kit components in a Vite + React Router app." actions={<Button>New item</Button>} />
      <ListGroup title="People">
        <ListRow leading={<UserIcon className="size-5" />} title="Ada Marsh" subtitle="Owner" href="/settings" chevron />
        <ListRow
          wrap
          title="Send the revised quote to the client before Friday's review"
          subtitle="They asked for the delivery dates to be split by phase, with the second phase priced separately."
        />
      </ListGroup>
    </div>
  );
}

function Settings() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-fit">
            Delete workspace
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the workspace?</AlertDialogTitle>
            <AlertDialogDescription>This removes every project in it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function App() {
  return (
    <AppShell brand={<span className="type-large">Acme</span>} nav={NAV}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}
