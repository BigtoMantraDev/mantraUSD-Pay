import { createRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  Keyboard,
  Settings,
  User,
} from 'lucide-react';
import React from 'react';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';

import { AddressDisplay } from '@/components/common/AddressDisplay';
import { ApprovalButton } from '@/components/common/ApprovalButton';
import { BalanceDisplay } from '@/components/common/BalanceDisplay';
import { ConnectGuard } from '@/components/common/ConnectGuard';
import { CopyButton } from '@/components/common/CopyButton';
import { NetworkBanner } from '@/components/common/NetworkBanner';
import { NetworkSelector } from '@/components/common/NetworkSelector';
import { PageError } from '@/components/common/PageError';
import { TokenInput } from '@/components/common/TokenInput';
import { TokenSelector, type Token } from '@/components/common/TokenSelector';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { WalletConnectPill } from '@/components/common/WalletConnectPill';
import { FaucetCard } from '@/components/features/FaucetCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CHAIN_CONFIGS } from '@/config/chains';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import type { TransactionStatus } from '@/hooks/useTransactionFlow';

import { Route as rootRoute } from '../__root';

export const kitchenSinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kitchen-sink',
  component: KitchenSink,
});

function KitchenSink() {
  const appConfig = useAppConfig();

  return (
    <div className="space-y-12 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
          Kitchen Sink
        </h1>
        <p className="text-xl text-white/80">
          Component design system showcasing strict adherence to the OMies
          Design System.
        </p>
      </div>

      <Section
        title="Configuration"
        description="Current chain and network info"
      >
        <div className="bg-white p-6 rounded-lg space-y-4 text-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Current Chain</p>
              <p className="font-semibold">{appConfig.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Chain ID</p>
              <p className="font-mono">{appConfig.chainId}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Is Testnet</p>
              <Badge variant={appConfig.isTestnet ? 'secondary' : 'default'}>
                {appConfig.isTestnet ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Is Supported</p>
              <Badge
                variant={appConfig.isSupported ? 'default' : 'destructive'}
              >
                {appConfig.isSupported ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-zinc-500">Explorer URL</p>
              <a
                href={appConfig.urls.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {appConfig.urls.explorer}
              </a>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-zinc-500 mb-2">Supported Chains</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(CHAIN_CONFIGS).map((config) => (
                <Badge
                  key={config.chainId}
                  variant={
                    config.chainId === appConfig.chainId ? 'default' : 'outline'
                  }
                >
                  {config.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Utilities"
        description="Common components for displaying blockchain data"
      >
        <div className="bg-white p-6 rounded-lg space-y-6 text-zinc-950">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">CopyButton</h4>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">Small:</span>
                <CopyButton
                  value="0x1234567890abcdef1234567890abcdef12345678"
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Medium:</span>
                <CopyButton
                  value="0x1234567890abcdef1234567890abcdef12345678"
                  size="md"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">With text:</span>
                <code className="bg-zinc-100 px-2 py-1 rounded text-xs font-mono">
                  0x1234...5678
                </code>
                <CopyButton
                  value="0x1234567890abcdef1234567890abcdef12345678"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">
              AddressDisplay
            </h4>
            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Default</span>
                <AddressDisplay address="0x1234567890abcdef1234567890abcdef12345678" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">No Copy</span>
                <AddressDisplay
                  address="0x1234567890abcdef1234567890abcdef12345678"
                  showCopy={false}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">
                  With Explorer Link
                </span>
                <AddressDisplay
                  address="0x1234567890abcdef1234567890abcdef12345678"
                  explorerUrl={appConfig.getExplorerAddressUrl(
                    '0x1234567890abcdef1234567890abcdef12345678',
                  )}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Custom Length</span>
                <AddressDisplay
                  address="0x1234567890abcdef1234567890abcdef12345678"
                  startChars={10}
                  endChars={6}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">
              BalanceDisplay
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Standard</span>
                <BalanceDisplay
                  value={BigInt('1234567890000000000')}
                  symbol="OM"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Large Number</span>
                <BalanceDisplay
                  value={BigInt('1234567890000000000000000')}
                  symbol="OM"
                  compact
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Small Size</span>
                <BalanceDisplay
                  value={BigInt('500000000000000000')}
                  symbol="ETH"
                  size="sm"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Large Size</span>
                <BalanceDisplay
                  value={BigInt('2500000000000000000')}
                  symbol="OM"
                  size="lg"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Loading</span>
                <BalanceDisplay isLoading />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">No Value</span>
                <BalanceDisplay symbol="OM" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">6 Decimals (USDC)</span>
                <BalanceDisplay
                  value={BigInt('1234567890')}
                  decimals={6}
                  symbol="USDC"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-400">Very Small</span>
                <BalanceDisplay
                  value={BigInt('123456789012345')}
                  symbol="ETH"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Wallet & Network"
        description="Wallet connection and network selection components"
      >
        <div className="space-y-6">
          {/* Network Banner Preview */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-white/70">NetworkBanner</h4>
            <div className="rounded-lg overflow-hidden border border-white/20">
              <NetworkBanner />
            </div>
            <p className="text-xs text-white/60">
              Shows testnet warning (yellow) or unsupported network error (red).
              Hidden on supported mainnets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg space-y-6 text-zinc-950">
            {/* Network Selector */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-zinc-500">
                NetworkSelector
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-400">Default</span>
                  <div>
                    <NetworkSelector />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Wallet Connect Pill */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-zinc-500">
                WalletConnectPill
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-400">Current State</span>
                  <div className="bg-primary p-4 rounded-lg">
                    <WalletConnectPill />
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Shows "Connect Wallet" when disconnected. When connected, shows
                balance and address with a popover menu for copy, explorer, and
                disconnect.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <TokenComponentsDemo />

      <TransactionDialogDemo />

      <Section
        title="Error Handling"
        description="Error states and fallback UI components"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-white/70">PageError</h4>
            <p className="text-sm text-white/60">
              A full-page error component shown when something goes wrong. Shows
              expanded error details in development mode.
            </p>
            <div className="rounded-lg overflow-hidden border border-white/20 bg-white">
              <PageError
                error={
                  new Error('Example error message for demonstration purposes')
                }
                title="Example Error"
                message="This is what the PageError component looks like when an error occurs."
                onRetry={() => alert('Retry clicked!')}
                retryLabel="Retry Action"
                showDetails
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Primary, secondary, and destructive actions"
      >
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges" description="Status indicators and labels">
        <div className="flex gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Cards" description="Content containers">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>
                Deploy your new project in one-click.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Name of your project" />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Alerts" description="Important messages">
        <div className="space-y-4 max-w-2xl">
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the cli.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section
        title="Typography (Headings)"
        description="Font styling and hierarchy"
      >
        <div className="bg-white p-6 rounded-lg space-y-4 text-zinc-950">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            The Joke Tax Chronicles
          </h1>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Once upon a time, in a far-off land, there was a very lazy king who
            spent all day lounging on his throne. One day, his advisors came to
            him with a problem: the kingdom was running out of money.
          </p>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            The King's Plan
          </h2>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            The Joke Tax
          </h3>
          <blockquote className="mt-6 border-l-2 pl-6 italic">
            "After all," he said, "everyone enjoys a good joke, so it's only
            fair that they should pay for the privilege."
          </blockquote>
        </div>
      </Section>

      <Section title="Form Inputs" description="User data entry">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-lg max-w-3xl text-zinc-950">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Password" />
          </div>
          <div className="space-y-2">
            <Label>Textarea</Label>
            <Textarea placeholder="Type your message here." />
          </div>
          <div className="space-y-2">
            <Label>Switch</Label>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Airplane Mode</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Checkbox</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Radio Group</Label>
            <RadioGroup defaultValue="comfortable">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="r1" />
                <Label htmlFor="r1">Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="r2" />
                <Label htmlFor="r2">Comfortable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="r3" />
                <Label htmlFor="r3">Compact</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Select</Label>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                  <SelectItem value="pineapple">Pineapple</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Slider</Label>
            <Slider defaultValue={[33]} max={100} step={1} />
          </div>
        </div>
      </Section>

      <Section title="Tabs & Accordions" description="Content organization">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-4 rounded-lg text-zinc-950">
            <Tabs defaultValue="account" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                Make changes to your account here.
              </TabsContent>
              <TabsContent value="password">
                Change your password here.
              </TabsContent>
            </Tabs>
          </div>
          <div className="bg-white p-4 rounded-lg text-zinc-950">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that matches the other
                  components&apos; aesthetic.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      <Section
        title="Overlays & Feedback"
        description="Modals, Dialogs, Popovers"
      >
        <div className="flex flex-wrap gap-4 bg-white p-6 rounded-lg">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the dimensions for the layer.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you're
                  done.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                <DrawerDescription>
                  This action cannot be undone.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      <Section title="Data Display" description="Tables, Avatars, etc.">
        <div className="bg-white p-6 rounded-lg space-y-8 text-zinc-950">
          <div className="flex gap-4 items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">@shadcn</h4>
              <p className="text-sm text-muted-foreground">
                Design systems are cool.
              </p>
            </div>
          </div>

          <Separator />

          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoice}>
                  <TableCell className="font-medium">
                    {invoice.invoice}
                  </TableCell>
                  <TableCell>{invoice.paymentStatus}</TableCell>
                  <TableCell>{invoice.paymentMethod}</TableCell>
                  <TableCell className="text-right">
                    {invoice.totalAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

/** Demo tokens for TokenSelector */
const DEMO_TOKENS: Token[] = [
  { symbol: 'OM', name: 'MANTRA', decimals: 18 },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x6B175474E89094C44Da98b954EescdeCB5c811111',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
];

/** Interactive demo for token components */
function TokenComponentsDemo() {
  const { address } = useAccount();
  const { isMobile } = useBreakpoints();
  const [tokenAmount, setTokenAmount] = React.useState('');
  const [selectedToken, setSelectedToken] = React.useState<Token | undefined>(
    DEMO_TOKENS[0],
  );

  return (
    <Section
      title="Token Components"
      description="Components for token selection, input, and approval flows"
    >
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg space-y-6 text-zinc-950">
          {/* TokenInput */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">TokenInput</h4>
            <p className="text-xs text-zinc-500 mb-3">
              Amount input with max button, balance display, and validation.
              Connect wallet to see balance.
            </p>
            <div className="max-w-sm">
              <TokenInput
                value={tokenAmount}
                onChange={setTokenAmount}
                ownerAddress={address}
                symbol="OM"
                decimals={18}
                label="Amount"
                showMaxButton
                showBalance
              />
            </div>
          </div>

          <Separator />

          {/* TokenSelector */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">TokenSelector</h4>
            <p className="text-xs text-zinc-500 mb-3">
              Searchable dropdown for selecting tokens with optional balance
              display.
            </p>
            <div className="flex items-center gap-4">
              <TokenSelector
                tokens={DEMO_TOKENS}
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                showBalances
              />
              {selectedToken && (
                <span className="text-sm text-zinc-600">
                  Selected: {selectedToken.symbol} ({selectedToken.decimals}{' '}
                  decimals)
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* ApprovalButton */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">
              ApprovalButton
            </h4>
            <p className="text-xs text-zinc-500 mb-3">
              Handles ERC20 approval flow. Hidden when already approved.
            </p>
            <div className="flex items-center gap-4">
              <ApprovalButton
                tokenAddress="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                spenderAddress="0x0000000000000000000000000000000000000001"
                forceShow
              >
                Approve USDC
              </ApprovalButton>
              <span className="text-xs text-zinc-500">
                (forceShow=true for demo)
              </span>
            </div>
          </div>

          <Separator />

          {/* ConnectGuard */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-500">ConnectGuard</h4>
            <p className="text-xs text-zinc-500 mb-3">
              Wraps content that requires wallet connection. Shows connect
              prompt when disconnected.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <ConnectGuard message="Connect your wallet to see protected content">
                <div className="p-4 bg-green-50 text-green-800">
                  ✅ You're connected! This content is now visible.
                </div>
              </ConnectGuard>
            </div>
          </div>
        </div>

        {/* FaucetCard (Feature Example) */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-white/70">
            FaucetCard (Feature Example)
          </h4>
          <p className="text-sm text-white/60">
            Example feature component showing best practices: ConnectGuard,
            TransactionDialog, useAppConfig.
          </p>
          <div className="max-w-md">
            <FaucetCard
              faucetAddress="0x0000000000000000000000000000000000000001"
              tokenSymbol="OM"
              dripAmount={parseEther('10')}
            />
          </div>
        </div>

        {/* useBreakpoints Demo */}
        <div className="bg-white p-6 rounded-lg space-y-3 text-zinc-950">
          <h4 className="font-medium text-sm text-zinc-500">
            useBreakpoints Hook
          </h4>
          <p className="text-xs text-zinc-500">
            Responsive breakpoint hook for conditional rendering.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isMobile ? 'default' : 'outline'}>
              {isMobile ? '📱 Mobile' : 'Mobile'}
            </Badge>
            <Badge variant={!isMobile ? 'default' : 'outline'}>
              {!isMobile ? '🖥️ Desktop' : 'Desktop'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Resize your browser to see the badges change.
          </p>
        </div>
      </div>
    </Section>
  );
}

/** Interactive demo component for TransactionDialog */
function TransactionDialogDemo() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [status, setStatus] = React.useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = React.useState<`0x${string}` | undefined>();

  const simulateTransaction = () => {
    setStatus('signing');
    setTimeout(() => {
      setStatus('pending');
      setTxHash(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
      setTimeout(() => {
        // Randomly succeed or fail for demo purposes
        if (Math.random() > 0.3) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      }, 2000);
    }, 1500);
  };

  const openReview = () => {
    setStatus('review');
    setDialogOpen(true);
  };

  const reset = () => {
    setStatus('idle');
    setTxHash(undefined);
    setDialogOpen(false);
  };

  return (
    <Section
      title="Transaction Flow"
      description="Transaction dialog for blockchain interactions"
    >
      <div className="bg-white p-6 rounded-lg space-y-6 text-zinc-950">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-zinc-500">
            TransactionDialog
          </h4>
          <p className="text-sm text-zinc-600">
            Click the button below to see the transaction dialog flow in action.
            The demo will simulate signing → pending → success/error.
          </p>
          <Button onClick={openReview}>Open Transaction Dialog</Button>
          <TransactionDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            status={status}
            txHash={txHash}
            error={
              status === 'error'
                ? new Error('User rejected the transaction')
                : undefined
            }
            title="Stake OM Tokens"
            description="Review the transaction details before confirming."
            reviewContent={
              <div className="space-y-3 p-4 bg-zinc-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Amount</span>
                  <span className="font-medium">100.00 OM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Lock Period</span>
                  <span className="font-medium">30 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Estimated APY</span>
                  <span className="font-medium text-green-600">12.5%</span>
                </div>
              </div>
            }
            onConfirm={simulateTransaction}
            onReset={reset}
            confirmLabel="Stake Tokens"
          />
        </div>
      </div>
    </Section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1 border-b border-white/20 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <div className="h-6 w-1 bg-[#F5B842] rounded-full" />
          {title}
        </h2>
        <p className="text-white/70">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
  },
];
