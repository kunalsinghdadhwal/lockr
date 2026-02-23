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
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { VaultEntry } from "@/crypto/entry-crypto";
import { useVault, type DecryptedItem } from "@/hooks/use-vault";

const categories = [
  { value: "all", label: "All" },
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

const INPUT_CLASS = "bg-white/[0.03] border-white/[0.06] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700 focus-visible:border-zinc-700";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,30,50,0.4)_0%,_transparent_70%)]" />

      <div className="relative w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-5">
            <Lock className="h-6 w-6 text-zinc-400" />
          </div>
          <h1 className="text-lg font-medium tracking-tight text-zinc-100">
            {isSetup ? "Create Master Password" : "Unlock Vault"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
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
                        className={`h-11 pr-10 ${INPUT_CLASS}`}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-zinc-600 hover:text-zinc-400 hover:bg-transparent"
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
              <div className="flex items-center gap-2 text-sm text-red-400/90 bg-red-400/[0.06] rounded-lg px-3 py-2.5 border border-red-400/[0.08]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-white font-medium"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSetup ? "Create Vault" : "Unlock"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-[11px] text-zinc-700 mt-6 tracking-wide uppercase">
          End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

// -- Entry Card --

function EntryCard({
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
    <Card className="group bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.05] shrink-0">
              <span className="text-sm font-semibold text-zinc-400 uppercase">
                {item.entry.serviceName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-medium text-zinc-200 truncate">
                {item.entry.serviceName}
              </CardTitle>
              <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                {item.entry.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="outline" className="text-[10px] text-zinc-500 border-white/[0.06] bg-transparent mr-1">
              {item.entry.category}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-zinc-300" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-red-400" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 flex items-center px-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <span className="text-xs text-zinc-400 truncate font-mono">{item.entry.username}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300" onClick={() => handleCopy(item.entry.username, "user")}>
            {copiedField === "user" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 flex items-center px-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <span className="text-xs text-zinc-400 truncate font-mono">
              {showPassword ? item.entry.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300" onClick={() => handleCopy(item.entry.password, "pass")}>
            {copiedField === "pass" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        {item.entry.notes && (
          <p className="text-[11px] text-zinc-600 leading-relaxed pt-1 line-clamp-2">{item.entry.notes}</p>
        )}
      </CardContent>
    </Card>
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
      <DialogContent className="bg-zinc-950 border-white/[0.06] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-base font-medium">
            {initialData ? "Edit Entry" : "New Entry"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {initialData ? "Update the details for this entry." : "Add a new credential to your vault."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="serviceName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400 text-xs">Service</FormLabel>
                <FormControl><Input placeholder="e.g. GitHub" className={INPUT_CLASS} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400 text-xs">Username / Email</FormLabel>
                <FormControl><Input placeholder="e.g. user@example.com" className={INPUT_CLASS} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400 text-xs">Password</FormLabel>
                <FormControl><Input type="password" placeholder="Enter password" className={INPUT_CLASS} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400 text-xs">Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={INPUT_CLASS}><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-950 border-white/[0.06]">
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
                <FormLabel className="text-zinc-400 text-xs">Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Any additional notes..." rows={2} className={`${INPUT_CLASS} resize-none`} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={saving} className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium">
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

// -- Main Dashboard --

export default function VaultDashboard() {
  const vault = useVault();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<DecryptedItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<DecryptedItem | null>(null);

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
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
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

  const initials = vault.userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-4.5 w-4.5 text-zinc-500" />
            <span className="text-sm font-semibold tracking-tight text-zinc-300">Lockr</span>
            <Badge variant="outline" className="text-[10px] border-white/[0.06] text-zinc-500 bg-transparent uppercase tracking-widest">
              {vault.userTier}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
              <Input
                type="search"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-56 h-8 pl-8 text-xs ${INPUT_CLASS}`}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-white/[0.06] text-zinc-400 text-[10px] font-medium">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-zinc-950 border-white/[0.06]">
                <DropdownMenuItem className="text-zinc-400 text-xs focus:bg-white/[0.04] focus:text-zinc-200">
                  <Key className="mr-2 h-3.5 w-3.5" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.04]" />
                <DropdownMenuItem onClick={vault.lock} className="text-zinc-400 text-xs focus:bg-white/[0.04] focus:text-zinc-200">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Lock Vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {vault.error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-400/90 bg-red-400/[0.06] rounded-lg px-4 py-3 border border-red-400/[0.08]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {vault.error}
            <button onClick={() => vault.setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">
              &times;
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-base font-medium text-zinc-200">
              Welcome back{vault.userName ? `, ${vault.userName.split(" ")[0]}` : ""}
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              {vault.items.length} {vault.items.length === 1 ? "entry" : "entries"} in your vault
              {vault.userTier === "free" && ` (${50 - vault.items.length} remaining)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32 h-8 bg-white/[0.03] border-white/[0.05] text-xs text-zinc-400 focus:ring-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/[0.06]">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Entry
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">
              {vault.items.length === 0 ? "Your vault is empty" : "No matching entries"}
            </p>
            <p className="text-xs text-zinc-700 mt-1">
              {vault.items.length === 0 ? "Add your first credential to get started" : "Try a different search or category"}
            </p>
            {vault.items.length === 0 && (
              <Button size="sm" onClick={() => setAddOpen(true)} className="mt-4 h-8 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <EntryCard key={item.id} item={item} onCopy={handleCopy} onEdit={() => setEditItem(item)} onDelete={() => setDeleteItem(item)} />
            ))}
          </div>
        )}
      </main>

      <EntryDialog open={addOpen} onOpenChange={setAddOpen} onSave={handleAddEntry} saving={vault.saving} />
      <EntryDialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} onSave={handleEditEntry} initialData={editItem?.entry} saving={vault.saving} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="bg-zinc-950 border-white/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 text-base">Delete entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-sm">
              This will permanently remove{" "}
              <span className="text-zinc-300">{deleteItem?.entry.serviceName}</span> from your vault.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.06] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
