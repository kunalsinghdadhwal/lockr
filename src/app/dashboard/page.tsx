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

import { authClient } from "@/lib/auth-client";
import { useVaultStore } from "@/crypto/store";
import {
  deriveMEKBits,
  importMEKForWrapping,
  generateSalt,
  type KdfParams,
  PBKDF2_DEFAULT,
} from "@/crypto/kdf";
import { generateVaultKey, wrapVaultKey, unwrapVaultKey } from "@/crypto/vault-key";
import {
  encryptEntry,
  decryptEntry,
  toBase64,
  fromBase64,
  type VaultEntry,
} from "@/crypto/entry-crypto";
import { deriveAuthKeyHash } from "@/crypto/auth-key";

// -- Types --

interface DecryptedItem {
  id: string;
  entry: VaultEntry;
  createdAt: string;
  updatedAt: string;
}

interface VaultMetadata {
  vault_salt: string | null;
  encrypted_vault_key: string | null;
  auth_key_hash: string | null;
  kdf_params: KdfParams | null;
  vault_initialized: boolean;
  tier: string;
}

// -- Schemas --

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

// -- API helpers --

async function fetchVaultMetadata(): Promise<VaultMetadata> {
  const res = await fetch("/api/vault/unlock");
  if (!res.ok) throw new Error("Failed to fetch vault metadata");
  return res.json();
}

async function fetchEntries(): Promise<
  { id: string; encrypted_blob: string; createdAt: string; updatedAt: string }[]
> {
  const res = await fetch("/api/vault/entries");
  if (!res.ok) throw new Error("Failed to fetch entries");
  const data = await res.json();
  return data.entries;
}

async function postVaultSetup(body: {
  vault_salt: string;
  encrypted_vault_key: string;
  auth_key_hash: string;
  kdf_params: KdfParams;
}) {
  const res = await fetch("/api/vault/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Setup failed");
  }
}

async function postEntry(encrypted_blob: string): Promise<{ id: string }> {
  const res = await fetch("/api/vault/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_blob }),
  });
  if (res.status === 403) throw new Error("Entry limit reached");
  if (!res.ok) throw new Error("Failed to save entry");
  return res.json();
}

async function putEntry(id: string, encrypted_blob: string) {
  const res = await fetch(`/api/vault/entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_blob }),
  });
  if (!res.ok) throw new Error("Failed to update entry");
}

async function deleteEntryApi(id: string) {
  const res = await fetch(`/api/vault/entries/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete entry");
}

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
                        className="h-11 bg-white/[0.03] border-white/[0.06] text-zinc-200 placeholder:text-zinc-600 pr-10 focus-visible:ring-zinc-700 focus-visible:border-zinc-700"
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
            <span className="text-xs text-zinc-400 truncate font-mono">
              {item.entry.username}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300"
            onClick={() => handleCopy(item.entry.username, "user")}
          >
            {copiedField === "user" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 flex items-center px-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <span className="text-xs text-zinc-400 truncate font-mono">
              {showPassword ? item.entry.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-600 hover:text-zinc-300"
            onClick={() => handleCopy(item.entry.password, "pass")}
          >
            {copiedField === "pass" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        {item.entry.notes && (
          <p className="text-[11px] text-zinc-600 leading-relaxed pt-1 line-clamp-2">
            {item.entry.notes}
          </p>
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

  const inputClass = "bg-white/[0.03] border-white/[0.06] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700 focus-visible:border-zinc-700";

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
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Service</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GitHub" className={inputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Username / Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. user@example.com" className={inputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" className={inputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-950 border-white/[0.06]">
                      {categories.filter((c) => c.value !== "all").map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." rows={2} className={`${inputClass} resize-none`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  const vaultKey = useVaultStore((s) => s.vaultKey);
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const setVaultKey = useVaultStore((s) => s.setVaultKey);
  const clearKeys = useVaultStore((s) => s.clearKeys);

  const [items, setItems] = React.useState<DecryptedItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [vaultMeta, setVaultMeta] = React.useState<VaultMetadata | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState("");
  const [userTier, setUserTier] = React.useState("free");

  // Dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<DecryptedItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<DecryptedItem | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Load vault metadata on mount
  React.useEffect(() => {
    (async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data) return;
        setUserName(session.data.user.name || "");

        const meta = await fetchVaultMetadata();
        setVaultMeta(meta);
        setUserTier(meta.tier);
      } catch {
        setError("Failed to load vault");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load and decrypt entries when vault is unlocked
  React.useEffect(() => {
    if (!isUnlocked || !vaultKey) return;

    (async () => {
      try {
        const rawEntries = await fetchEntries();
        const decrypted: DecryptedItem[] = [];

        for (const raw of rawEntries) {
          const blob = fromBase64(raw.encrypted_blob);
          const entry = await decryptEntry(blob, vaultKey);
          decrypted.push({
            id: raw.id,
            entry,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          });
        }

        setItems(decrypted);
      } catch {
        setError("Failed to decrypt entries");
      }
    })();
  }, [isUnlocked, vaultKey]);

  // -- Vault setup (first time) --
  const handleSetup = async (masterPassword: string) => {
    const salt = generateSalt();
    const kdfParams = PBKDF2_DEFAULT;

    const mekBits = await deriveMEKBits(masterPassword, salt, kdfParams);
    const mekWrapping = await importMEKForWrapping(mekBits);
    const vk = await generateVaultKey();
    const wrappedVK = await wrapVaultKey(vk, mekWrapping);
    const authHash = await deriveAuthKeyHash(mekBits);

    await postVaultSetup({
      vault_salt: toBase64(salt),
      encrypted_vault_key: toBase64(wrappedVK),
      auth_key_hash: authHash,
      kdf_params: kdfParams,
    });

    setVaultKey(vk);
    setVaultMeta((prev) => (prev ? { ...prev, vault_initialized: true } : prev));
  };

  // -- Vault unlock (returning user) --
  const handleUnlock = async (masterPassword: string) => {
    if (!vaultMeta || !vaultMeta.vault_salt || !vaultMeta.encrypted_vault_key || !vaultMeta.kdf_params || !vaultMeta.auth_key_hash) {
      throw new Error("Vault metadata missing");
    }

    const salt = fromBase64(vaultMeta.vault_salt);
    const mekBits = await deriveMEKBits(masterPassword, salt, vaultMeta.kdf_params);
    const authHash = await deriveAuthKeyHash(mekBits);

    if (authHash !== vaultMeta.auth_key_hash) {
      throw new Error("Wrong master password");
    }

    const mekWrapping = await importMEKForWrapping(mekBits);
    const wrappedVK = fromBase64(vaultMeta.encrypted_vault_key);
    const vk = await unwrapVaultKey(wrappedVK, mekWrapping);

    setVaultKey(vk);
  };

  // -- CRUD --
  const handleAddEntry = async (data: VaultEntry) => {
    if (!vaultKey) return;
    setSaving(true);
    try {
      const blob = await encryptEntry(data, vaultKey);
      const { id } = await postEntry(toBase64(blob));
      setItems((prev) => [
        { id, entry: data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...prev,
      ]);
      setAddOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = async (data: VaultEntry) => {
    if (!vaultKey || !editItem) return;
    setSaving(true);
    try {
      const blob = await encryptEntry(data, vaultKey);
      await putEntry(editItem.id, toBase64(blob));
      setItems((prev) =>
        prev.map((it) =>
          it.id === editItem.id
            ? { ...it, entry: data, updatedAt: new Date().toISOString() }
            : it
        )
      );
      setEditItem(null);
    } catch {
      setError("Failed to update entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteItem) return;
    try {
      await deleteEntryApi(deleteItem.id);
      setItems((prev) => prev.filter((it) => it.id !== deleteItem.id));
      setDeleteItem(null);
    } catch {
      setError("Failed to delete entry");
    }
  };

  const handleLock = () => {
    clearKeys();
    setItems([]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // -- Filtering --
  const filtered = React.useMemo(() => {
    let result = items;
    if (selectedCategory !== "all") {
      result = result.filter(
        (it) => it.entry.category.toLowerCase() === selectedCategory
      );
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
  }, [items, selectedCategory, searchQuery]);

  // -- Loading state --
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  // -- Unlock / Setup screen --
  if (!isUnlocked) {
    const isSetup = vaultMeta ? !vaultMeta.vault_initialized : true;
    return (
      <UnlockScreen
        onUnlock={isSetup ? handleSetup : handleUnlock}
        isSetup={isSetup}
      />
    );
  }

  // -- Main vault UI --
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-4.5 w-4.5 text-zinc-500" />
            <span className="text-sm font-semibold tracking-tight text-zinc-300">Lockr</span>
            <Badge
              variant="outline"
              className="text-[10px] border-white/[0.06] text-zinc-500 bg-transparent uppercase tracking-widest"
            >
              {userTier}
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
                className="w-56 h-8 pl-8 bg-white/[0.03] border-white/[0.05] text-xs text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
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
                <DropdownMenuItem onClick={handleLock} className="text-zinc-400 text-xs focus:bg-white/[0.04] focus:text-zinc-200">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Lock Vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-400/90 bg-red-400/[0.06] rounded-lg px-4 py-3 border border-red-400/[0.08]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">
              &times;
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-base font-medium text-zinc-200">
              Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              {items.length} {items.length === 1 ? "entry" : "entries"} in your vault
              {userTier === "free" && ` (${50 - items.length} remaining)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32 h-8 bg-white/[0.03] border-white/[0.05] text-xs text-zinc-400 focus:ring-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/[0.06]">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="h-8 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Entries grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">
              {items.length === 0 ? "Your vault is empty" : "No matching entries"}
            </p>
            <p className="text-xs text-zinc-700 mt-1">
              {items.length === 0
                ? "Add your first credential to get started"
                : "Try a different search or category"}
            </p>
            {items.length === 0 && (
              <Button
                size="sm"
                onClick={() => setAddOpen(true)}
                className="mt-4 h-8 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <EntryCard
                key={item.id}
                item={item}
                onCopy={handleCopy}
                onEdit={() => setEditItem(item)}
                onDelete={() => setDeleteItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add dialog */}
      <EntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAddEntry}
        saving={saving}
      />

      {/* Edit dialog */}
      <EntryDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSave={handleEditEntry}
        initialData={editItem?.entry}
        saving={saving}
      />

      {/* Delete confirmation */}
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
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
