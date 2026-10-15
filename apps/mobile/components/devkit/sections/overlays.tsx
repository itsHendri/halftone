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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useContentInsets() {
  const insets = useSafeAreaInsets();
  return { top: insets.top, bottom: insets.bottom, left: 12, right: 12 };
}

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Text>Open dialog</Text>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes to your profile, then save.</DialogDescription>
        </DialogHeader>
        <View className="gap-3">
          <Label htmlFor="dlg-name">Name</Label>
          <Input id="dlg-name" defaultValue="Jane Doe" />
        </View>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button>
            <Text>Save</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Text>Delete account</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Your account and data will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive">
            <Text className="text-destructive-foreground">Delete account</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full">
          <Text>Open popover</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100%-40px)]" side="bottom">
        <View className="gap-3">
          <Text className="font-semibold">Rename list</Text>
          <Text className="text-muted-foreground text-sm">A quick edit next to the thing it changes.</Text>
          <View className="gap-2">
            <Label htmlFor="pop-name">Name</Label>
            <Input id="pop-name" defaultValue="Weekend plans" />
          </View>
          <Button size="sm">
            <Text>Save</Text>
          </Button>
        </View>
      </PopoverContent>
    </Popover>
  );
}

function DropdownMenuDemo() {
  const insets = useContentInsets();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Text>Account menu</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent insets={insets} sideOffset={4} className="w-56" align="start">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Text>Profile</Text>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Text>Billing</Text>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Text>Settings</Text>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Text>Log out</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContextMenuDemo() {
  const insets = useContentInsets();
  return (
    <ContextMenu className="h-[120px] w-full">
      <ContextMenuTrigger
        onLongPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        className="border-border flex h-full w-full items-center justify-center rounded-md border border-dashed">
        <Text className="text-sm">{Platform.select({ web: 'Right-click here', default: 'Long-press here' })}</Text>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52" insets={insets}>
        <ContextMenuItem>
          <Text>Copy</Text>
        </ContextMenuItem>
        <ContextMenuItem>
          <Text>Share</Text>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Text>Delete</Text>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function HoverCardDemo() {
  const insets = useContentInsets();
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline" className="w-full">
          <Text>Show profile card</Text>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent insets={insets} className="w-80">
        <View className="flex-row gap-4">
          <Avatar alt="Expo">
            <AvatarImage source={{ uri: 'https://github.com/expo.png' }} />
            <AvatarFallback>
              <Text>E</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1 gap-1">
            <Text className="text-sm font-semibold">@expo</Text>
            <Text className="text-sm">Framework and tools for creating native apps with React.</Text>
          </View>
        </View>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const OVERLAYS_DEMOS: Record<string, ComponentType> = {
  'dialog': DialogDemo,
  'alert-dialog': AlertDialogDemo,
  'popover': PopoverDemo,
  'dropdown-menu': DropdownMenuDemo,
  'context-menu': ContextMenuDemo,
  'hover-card': HoverCardDemo,
};
