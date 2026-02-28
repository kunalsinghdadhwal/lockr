"use client";

import * as React from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Pencil,
  Zap,
  Crown,
  LayoutGrid,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { VaultEntry } from "@/crypto/entry-crypto";
import { useVault, type DecryptedItem } from "@/hooks/use-vault";
import { authClient } from "@/lib/auth-client";

const categories = [
  { value: "all", label: "All Categories", icon: LayoutGrid },
  { value: "social", label: "Social" },
  { value: "development", label: "Development" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "finance", label: "Finance" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

const entryFormSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  notes: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

const masterPasswordSchema = z.object({
  password: z.string().min(1, "Master password is required"),
});

// -- Unlock Screen --

function UnlockScreen({
  onUnlock,
  isSetup,
}: {
  onUnlock: (password: string) => Promise<void>;
  isSetup: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof masterPasswordSchema>>({
    resolver: zodResolver(masterPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (values: z.infer<typeof masterPasswordSchema>) => {
    setLoading(true);
    setError(null);
    try {
      await onUnlock(values.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--muted))_0%,_transparent_70%)]" />

      <div className="relative w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border bg-card mb-5">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-medium tracking-tight text-foreground">
            {isSetup ? "Create Master Password" : "Unlock Vault"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isSetup
              ? "Choose a strong master password to protect your vault"
              : "Enter your master password to continue"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Master password"
                        autoFocus
                        className="h-11 pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 border border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-medium"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSetup ? "Create Vault" : "Unlock"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-6 tracking-wide uppercase">
          End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

// -- Entry Row (Table) --

function EntryRow({
  item,
  onCopy,
  onEdit,
  onDelete,
}: {
  item: DecryptedItem;
  onCopy: (text: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    onCopy(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border bg-muted/50 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {item.entry.serviceName.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-foreground">
            {item.entry.serviceName}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-muted-foreground text-xs">
            {item.entry.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            onClick={() => handleCopy(item.entry.username, "user")}
          >
            {copiedField === "user" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-muted-foreground text-xs w-24 truncate">
            {showPassword ? item.entry.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            onClick={() => handleCopy(item.entry.password, "pass")}
          >
            {copiedField === "pass" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-[10px] font-normal capitalize">
          {item.entry.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Edit</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Delete</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

// -- Add/Edit Dialog --

function EntryDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: VaultEntry) => Promise<void>;
  initialData?: VaultEntry;
  saving: boolean;
}) {
  const form = useForm<z.infer<typeof entryFormSchema>>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      serviceName: initialData?.serviceName ?? "",
      username: initialData?.username ?? "",
      password: initialData?.password ?? "",
      notes: initialData?.notes ?? "",
      category: initialData?.category ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        serviceName: initialData?.serviceName ?? "",
        username: initialData?.username ?? "",
        password: initialData?.password ?? "",
        notes: initialData?.notes ?? "",
        category: initialData?.category ?? "",
      });
    }
  }, [open, initialData, form]);

  const onSubmit = async (values: z.infer<typeof entryFormSchema>) => {
    await onSave({
      serviceName: values.serviceName,
      username: values.username,
      password: values.password,
      notes: values.notes || undefined,
      category: values.category,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {initialData ? "Edit Entry" : "New Entry"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {initialData ? "Update the details for this entry." : "Add a new credential to your vault."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="serviceName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Service</FormLabel>
                <FormControl><Input placeholder="e.g. GitHub" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Username / Email</FormLabel>
                <FormControl><Input placeholder="e.g. user@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Password</FormLabel>
                <FormControl><Input type="password" placeholder="Enter password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.filter((c) => c.value !== "all").map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Any additional notes..." rows={2} className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={saving} className="font-medium">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save Changes" : "Add Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// -- Sidebar --

function Sidebar({
  userName,
  userTier,
  selectedCategory,
  onCategoryChange,
  onLock,
  onUpgrade,
  checkoutLoading,
  itemCounts,
  mobileOpen,
  onMobileClose,
}: {
  userName: string;
  userTier: string;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onLock: () => void;
  onUpgrade: () => void;
  checkoutLoading: boolean;
  itemCounts: Record<string, number>;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <Logo className="h-4.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 lg:hidden"
          onClick={onMobileClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-2 mb-2">
          Categories
        </p>
        <nav className="space-y-0.5">
          {categories.map((cat) => {
            const count = cat.value === "all"
              ? Object.values(itemCounts).reduce((a, b) => a + b, 0)
              : (itemCounts[cat.value] ?? 0);
            return (
              <button
                key={cat.value}
                onClick={() => {
                  onCategoryChange(cat.value);
                  onMobileClose();
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                  selectedCategory === cat.value
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span className="truncate">{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Upgrade CTA */}
      {userTier === "free" && (
        <div className="px-3 pb-2">
          <button
            onClick={onUpgrade}
            disabled={checkoutLoading}
            className="flex w-full items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Upgrade to Premium</p>
              <p className="text-[10px] text-muted-foreground">Unlimited entries & more</p>
            </div>
          </button>
        </div>
      )}

      <Separator />

      {/* User */}
      <div className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-medium bg-muted">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName || "User"}</p>
                <div className="flex items-center gap-1">
                  {userTier === "premium" ? (
                    <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                      <Crown className="h-2.5 w-2.5" /> Premium
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Free plan</span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-48">
            <DropdownMenuItem>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-3.5 w-3.5" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLock}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Lock Vault
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r bg-card/50 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

// -- Main Dashboard --

export default function VaultDashboard() {
  const vault = useVault();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<DecryptedItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<DecryptedItem | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      setUpgradeSuccess(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const handleUpgradeCheckout = async () => {
    setCheckoutLoading(true);
    try {
      // @ts-expect-error -- polar plugin types
      await authClient.polar.checkout({ slug: "premium" });
    } catch {
      vault.setError("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const itemCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of vault.items) {
      const cat = item.entry.category.toLowerCase();
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [vault.items]);

  const filtered = React.useMemo(() => {
    let result = vault.items;
    if (selectedCategory !== "all") {
      result = result.filter((it) => it.entry.category.toLowerCase() === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (it) =>
          it.entry.serviceName.toLowerCase().includes(q) ||
          it.entry.username.toLowerCase().includes(q) ||
          (it.entry.notes && it.entry.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [vault.items, selectedCategory, searchQuery]);

  const handleAddEntry = async (data: VaultEntry) => {
    await vault.addEntry(data);
    setAddOpen(false);
  };

  const handleEditEntry = async (data: VaultEntry) => {
    if (!editItem) return;
    await vault.editEntry(editItem.id, data);
    setEditItem(null);
  };

  const handleDeleteEntry = async () => {
    if (!deleteItem) return;
    await vault.deleteEntry(deleteItem.id);
    setDeleteItem(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (vault.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vault.isUnlocked) {
    return (
      <UnlockScreen
        onUnlock={vault.isSetup ? vault.handleSetup : vault.handleUnlock}
        isSetup={vault.isSetup}
      />
    );
  }

  const totalEntries = vault.items.length;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        userName={vault.userName}
        userTier={vault.userTier}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onLock={vault.lock}
        onUpgrade={handleUpgradeCheckout}
        checkoutLoading={checkoutLoading}
        itemCounts={itemCounts}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 backdrop-blur-xl px-6 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div>
              <h1 className="text-sm font-medium text-foreground truncate">
                {selectedCategory === "all" ? "All Entries" : categories.find(c => c.value === selectedCategory)?.label}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
                {vault.userTier === "free" && ` / ${50 - totalEntries} remaining`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-52 h-8 pl-8 text-xs"
              />
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 text-xs font-medium">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Entry
            </Button>
          </div>
        </header>

        <div className="px-6 py-6">
          {/* Mobile search */}
          <div className="relative sm:hidden mb-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 text-xs"
            />
          </div>

          {/* Alerts */}
          {upgradeSuccess && (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3 border border-emerald-500/20">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Welcome to Premium! Your vault now supports unlimited entries, Argon2id encryption, and recovery keys.
              <button onClick={() => setUpgradeSuccess(false)} className="ml-auto opacity-50 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {vault.error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {vault.error}
              <button onClick={() => vault.setError(null)} className="ml-auto opacity-50 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-2xl border bg-muted/50 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {totalEntries === 0 ? "Your vault is empty" : "No matching entries"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {totalEntries === 0 ? "Add your first credential to get started" : "Try a different search or category"}
              </p>
              {totalEntries === 0 && (
                <Button size="sm" onClick={() => setAddOpen(true)} className="mt-4 h-8 text-xs font-medium">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px]">Service</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <EntryRow
                      key={item.id}
                      item={item}
                      onCopy={handleCopy}
                      onEdit={() => setEditItem(item)}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <EntryDialog open={addOpen} onOpenChange={setAddOpen} onSave={handleAddEntry} saving={vault.saving} />
      <EntryDialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} onSave={handleEditEntry} initialData={editItem?.entry} saving={vault.saving} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{deleteItem?.entry.serviceName}</span> from your vault.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
