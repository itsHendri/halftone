import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { ChevronsUpDownIcon } from 'lucide-react-native';
import { View } from 'react-native';

function CardDemo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscribe to updates</CardTitle>
        <CardDescription>Enter your details to receive occasional news.</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="gap-2">
          <Label htmlFor="card-email">Email</Label>
          <Input id="card-email" placeholder="you@example.com" />
        </View>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">
          <Text>Subscribe</Text>
        </Button>
        <Button variant="outline" className="w-full">
          <Text>Later</Text>
        </Button>
      </CardFooter>
    </Card>
  );
}

function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <Text>Product information</Text>
        </AccordionTrigger>
        <AccordionContent>
          <Text>Built with premium materials, it offers unparalleled performance and reliability.</Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <Text>Shipping details</Text>
        </AccordionTrigger>
        <AccordionContent>
          <Text>Standard delivery takes 3–5 business days; express within 1–2.</Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <Text>Return policy</Text>
        </AccordionTrigger>
        <AccordionContent>
          <Text>30-day returns, free return shipping, refunds within 48 hours.</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function CollapsibleDemo() {
  return (
    <Collapsible className="w-full gap-2">
      <View className="flex-row items-center justify-between gap-4 px-1">
        <Text className="text-sm font-semibold">3 starred repositories</Text>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" accessibilityLabel="Toggle">
            <Icon as={ChevronsUpDownIcon} />
          </Button>
        </CollapsibleTrigger>
      </View>
      <View className="border-border rounded-md border px-4 py-2">
        <Text className="text-sm">expo/expo</Text>
      </View>
      <CollapsibleContent className="gap-2">
        <View className="border-border rounded-md border px-4 py-2">
          <Text className="text-sm">founded-labs/react-native-reusables</Text>
        </View>
        <View className="border-border rounded-md border px-4 py-2">
          <Text className="text-sm">nativewind/nativewind</Text>
        </View>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const LAYOUT_DEMOS: Record<string, ComponentType> = {
  'card': CardDemo,
  'accordion': AccordionDemo,
  'collapsible': CollapsibleDemo,
};
