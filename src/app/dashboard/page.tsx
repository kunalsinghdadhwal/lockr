"use client";

import { CardDescription } from "@/components/ui/card";
import * as React from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings,
  Shield,
  User,
  Check,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { deriveKey } from "@/helpers/encryption";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { decryptAES256GCM, encryptAES256GCM } from "@/helpers/aesEncryption";

type PasswordItem = {
  userId: string;
  username: string;
  password: string;
  notes?: string | null; 
  category: string;
  createdAt?: string;
  updatedAt?: string;
};

const categories = [
  { value: "all", label: "All Passwords" },
  { value: "social", label: "Social" },
  { value: "development", label: "Development" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "storage", label: "Storage" },
];

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  category: z.string().min(1, "Category is required"),
});

// Master password schema
const masterPasswordSchema = z.object({
  password: z.string(),
});

const fetchPasswords = async (userId: string) => {
  try {
    const response = await fetch("/api/passwords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch passwords");
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching passwords:", error);
    return [];
  }
};


function MasterPasswordAuth({
  onAuthenticate,
}: {
  onAuthenticate: (password: string) => void;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof masterPasswordSchema>>({
    resolver: zodResolver(masterPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof masterPasswordSchema>) => {
    if (!values.password) {
      setAuthError("Password is required");
      return;
    }
    const session = await authClient.getSession();
    if (!session) {
      setAuthError("Session not found");
      return;
    }
    const key = await deriveKey(
      session.data?.user.email as string,
      session.data?.session.userId as string,
      values.password,
    )
    localStorage.setItem("masterKey", key.key);
    setAuthError(null);
    onAuthenticate(values.password);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>VaultKey</CardTitle>
          </div>
          <CardDescription>
            Enter your master password to unlock your password vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Master Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your master password"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          Toggle password visibility
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Unlock Vault
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PasswordDashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState(categories[0]);
  const [copiedItems, setCopiedItems] = React.useState<Record<string, boolean>>(
    {}
  );
  const [passwordItems, setPasswordItems] = React.useState<PasswordItem[]>([]);
  const [encryptedData, setEncryptedData] = React.useState<PasswordItem[]>([]);
  useEffect(() => {
  const fetchData = async () => {
    try {
      const session = await authClient.getSession();
      if (!session) return;
      const encryptionKey = localStorage.getItem("masterKey") as string;
      const userId = session.data?.session.userId as string;
      const passwords = await fetchPasswords(userId);
      setEncryptedData(passwords);
      const decryptedPasswords = await Promise.all(
        passwords.map(async (entry) => ({
          ...entry,
          password: await decryptAES256GCM(entry.password, Buffer.from(encryptionKey, "base64")),
        }))
      );
      console.log(passwords);
      setPasswordItems(decryptedPasswords);
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };

  fetchData(); 
}, []);

  const { setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [masterPassword, setMasterPassword] = React.useState<string | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      category: "",
    },
  });

  // Handle authentication
  const handleAuthentication = (password: string) => {
    setMasterPassword(password);
    setIsAuthenticated(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!masterPassword) return;

    const session = await authClient.getSession();
    if (!session) return;
    const encryptionKey = localStorage.getItem("masterKey") as string;
    const userId = session.data?.session.userId as string;
    
    // Create new password item
    const newPassword = {
      userId: userId,
      name: values.name,
      username: values.username,
      password: values.password,
      lastUpdated: "Just now",
      category: values.category,
    };
    
    // Add to passwords list
    const updatedItems = [newPassword, ...passwordItems];
    setPasswordItems(updatedItems);
    
    // Update encrypted data
    const encryptedPassword = await encryptAES256GCM(values.password, Buffer.from(encryptionKey, "base64"));

    const newEncryptedPassword = {
      userId: userId,
      name: values.name,
      username: values.username,
      password: encryptedPassword.encryptedText,
      category: values.category,
    }
    const savePasswordEntry = async () => {
      try {
        const response = await fetch('/api/saveEntry', {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEncryptedPassword),
        });

    if (!response.ok) {
      throw new Error('Failed to save password entry');
    }

    const data = await response.json();
    console.log('Password entry saved:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

savePasswordEntry();

    const updatedEncryptedData = [newEncryptedPassword, ...encryptedData];
    setEncryptedData(updatedEncryptedData);

    form.reset();
    setOpen(false);
  };

  React.useEffect(() => {
    setTheme("dark");
  }, [setTheme]);


  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems((prev) => ({ ...prev, [itemId]: true }));

    setTimeout(() => {
      setCopiedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 2000);
  };

  // Filter passwords based on selected category
  const filteredPasswords = React.useMemo(() => {
    return selectedCategory.value === "all"
      ? passwordItems
      : passwordItems.filter(
          (item) =>
            item.category.toLowerCase() === selectedCategory.value.toLowerCase()
        );
  }, [passwordItems, selectedCategory.value]);

  // Lock the vault (log out)
  const lockVault = () => {
    setIsAuthenticated(false);
    setMasterPassword(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="dark">
        <MasterPasswordAuth onAuthenticate={handleAuthentication} />
      </div>
    );
  }

  return (
    <div className="dark">
      <SidebarProvider>
        <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
          <Sidebar className="border-r border-border/40">
            <SidebarHeader className="border-b border-border/40">
              <div className="flex items-center gap-2 px-4 py-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VaultKey</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Main</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive tooltip="Dashboard">
                        <Key className="h-4 w-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Categories">
                        <BadgeCheck className="h-4 w-4" />
                        <span>Categories</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Generator">
                        <Lock className="h-4 w-4" />
                        <span>Password Generator</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Security">
                        <Shield className="h-4 w-4" />
                        <span>Security Check</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Settings</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Account">
                        <User className="h-4 w-4" />
                        <span>Account</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Preferences">
                        <Settings className="h-4 w-4" />
                        <span>Preferences</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-border/40">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="User"
                    />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">Premium</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={lockVault}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Lock Vault</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <div className="flex flex-col bg-background">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/40 bg-background px-6">
              <SidebarTrigger />
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">Password Vault</h1>
                  <Badge variant="outline" className="ml-2">
                    Premium
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search passwords..."
                      className="w-full rounded-full bg-muted pl-8 md:w-[300px]"
                    />
                  </div>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Password</DialogTitle>
                        <DialogDescription>
                          Add a new password to your vault. All fields are
                          required.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Site/App Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Google" {...field} />
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
                                <FormLabel>Username/Email</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. user@example.com"
                                    {...field}
                                  />
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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Enter password"
                                    {...field}
                                  />
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
                                <FormLabel>Category</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit">Save Password</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-background">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Welcome back, John
                  </h2>
                  <p className="text-muted-foreground">
                    Here&#39;s a summary of your password vault
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {selectedCategory.label}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.value}
                              onSelect={() => {
                                setSelectedCategory(category);
                              }}
                              className="flex items-center gap-2 text-sm"
                            >
                              {category.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Passwords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {passwordItems.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +3 this month
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Weak Passwords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      -2 from last check
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Password Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87%</div>
                    <p className="text-xs text-muted-foreground">
                      +5% from last check
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mb-4">
                <h3 className="mb-4 text-lg font-medium">Recent Passwords</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPasswords.map((item) => (
                    <Card
                      key={item.userId}
                      className="overflow-hidden backdrop-blur-sm"
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {item.username}
                          </CardTitle>
                          <Badge variant="outline" className="bg-muted/50">
                            {item.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 pt-0">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            value={item.username}
                            readOnly
                            className="pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              copyToClipboard(
                                item.username,
                                `username-${item.userId}`
                              )
                            }
                          >
                            {copiedItems[`username-${item.userId}`] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copy username</span>
                          </Button>
                        </div>
                        <div className="relative flex-1">
                          <Input
                            readOnly
                            className="pr-20"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-10 top-0 h-full text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              copyToClipboard(
                                item.password,
                                `password-${item.userId}`
                              )
                            }
                          >
                            {copiedItems[`password-${item.userId}`] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copy password</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                          >
                            <span className="sr-only">
                              Toggle password visibility
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-border/40 p-4 text-xs text-muted-foreground">
                        Last updated 
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
