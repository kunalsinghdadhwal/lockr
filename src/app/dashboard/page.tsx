"use client"

import * as React from "react"
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
} from "lucide-react"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/sidebar"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  category: z.string().min(1, "Category is required"),
})

// Sample data
const passwordItems = [
  {
    id: 1,
    name: "Google",
    username: "user@example.com",
    strength: 85,
    lastUpdated: "2 days ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Social",
  },
  {
    id: 2,
    name: "GitHub",
    username: "devuser",
    strength: 95,
    lastUpdated: "1 week ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Development",
  },
  {
    id: 3,
    name: "Netflix",
    username: "user@example.com",
    strength: 70,
    lastUpdated: "1 month ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Entertainment",
  },
  {
    id: 4,
    name: "Amazon",
    username: "user@example.com",
    strength: 80,
    lastUpdated: "2 weeks ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Shopping",
  },
  {
    id: 5,
    name: "Dropbox",
    username: "user@example.com",
    strength: 90,
    lastUpdated: "3 days ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Storage",
  },
  {
    id: 6,
    name: "Twitter",
    username: "user@example.com",
    strength: 75,
    lastUpdated: "5 days ago",
    logo: "/placeholder.svg?height=40&width=40",
    category: "Social",
  },
]

const categories = [
  { value: "all", label: "All Passwords" },
  { value: "social", label: "Social" },
  { value: "development", label: "Development" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "storage", label: "Storage" },
]

export default function PasswordDashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState(categories[0])
  const [showPassword, setShowPassword] = React.useState<Record<number, boolean>>({})
  const [passwordItems, setPasswordItems] = React.useState([
    {
      id: 1,
      name: "Google",
      username: "user@example.com",
      strength: 85,
      lastUpdated: "2 days ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Social",
    },
    {
      id: 2,
      name: "GitHub",
      username: "devuser",
      strength: 95,
      lastUpdated: "1 week ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Development",
    },
    {
      id: 3,
      name: "Netflix",
      username: "user@example.com",
      strength: 70,
      lastUpdated: "1 month ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Entertainment",
    },
    {
      id: 4,
      name: "Amazon",
      username: "user@example.com",
      strength: 80,
      lastUpdated: "2 weeks ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Shopping",
    },
    {
      id: 5,
      name: "Dropbox",
      username: "user@example.com",
      strength: 90,
      lastUpdated: "3 days ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Storage",
    },
    {
      id: 6,
      name: "Twitter",
      username: "user@example.com",
      strength: 75,
      lastUpdated: "5 days ago",
      logo: "/placeholder.svg?height=40&width=40",
      category: "Social",
    },
  ])
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      category: "",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Calculate password strength (simple example)
    const strength = Math.floor(Math.random() * (95 - 70 + 1)) + 70

    // Create new password item
    const newPassword = {
      id: passwordItems.length + 1,
      name: values.name,
      username: values.username,
      strength,
      lastUpdated: "Just now",
      logo: "/placeholder.svg?height=40&width=40",
      category: values.category,
    }

    // Add to passwords list
    setPasswordItems((prev) => [newPassword, ...prev])

    // Reset form and close modal
    form.reset()
    setOpen(false)
  }

  React.useEffect(() => {
    // Set dark theme on component mount
    setTheme("dark")
  }, [setTheme])

  const togglePasswordVisibility = (id: number) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // ... (rest of the component remains the same until the Add Password button)
  const filteredPasswords = React.useMemo(() => {
    return selectedCategory.value === "all"
      ? passwordItems
      : passwordItems.filter((item) => item.category.toLowerCase() === selectedCategory.value.toLowerCase())
  }, [passwordItems, selectedCategory.value])

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
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">Premium</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
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
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
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
                          Add a new password to your vault. All fields are required.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                  <Input placeholder="e.g. user@example.com" {...field} />
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
                                  <Input type="password" placeholder="Enter password" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category.value} value={category.value}>
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
                  <h2 className="text-2xl font-bold tracking-tight">Welcome back, John</h2>
                  <p className="text-muted-foreground">Here's a summary of your password vault</p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
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
                                setSelectedCategory(category)
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
                    <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">+3 this month</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">-2 from last check</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Password Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87%</div>
                    <p className="text-xs text-muted-foreground">+5% from last check</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mb-4">
                <h3 className="mb-4 text-lg font-medium">Recent Passwords</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPasswords.map((item) => (
                    <Card key={item.id} className="overflow-hidden backdrop-blur-sm">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <Badge variant="outline" className="bg-muted/50">
                            {item.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 pt-0">
                        <div className="relative flex-1">
                          <Input type="text" value={item.username} readOnly className="pr-10" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => copyToClipboard(item.username)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy username</span>
                          </Button>
                        </div>
                        <div className="relative flex-1">
                          <Input
                            type={showPassword[item.id] ? "text" : "password"}
                            value="••••••••••••"
                            readOnly
                            className="pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-8 top-0 h-full"
                            onClick={() => copyToClipboard("password123")}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy password</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => togglePasswordVisibility(item.id)}
                          >
                            {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-border/40 p-4 text-xs text-muted-foreground">
                        Last updated {item.lastUpdated}
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
  )
}

