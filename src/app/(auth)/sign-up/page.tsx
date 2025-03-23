"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/zod";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Lock, User, Mail, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import LoadingButton from "@/components/loading-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUp() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // States for password UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [pending, setPending] = useState(false);

  // Using the signUpSchema from your lib
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Calculate password strength based on common criteria.
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  // Submit handler: using your authClient.signUp logic
  const onSubmit = async (values: SignUpValues) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onRequest: () => {
          setPending(true);
        },
        onSuccess: () => {
          toast({
            title: "Account created",
            description:
              "Your account has been created. Check your email for a verification link.",
          });
        },
        onError: (ctx) => {
          console.log("error", ctx);
          toast({
            title: "Something went wrong",
            description: ctx.error.message ?? "Something went wrong.",
          });
        },
      }
    );
    setPending(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Theme toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-sun"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-moon"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </Button>
      </div>

      {/* Left side - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-1 px-0">
            <CardTitle className="text-3xl font-bold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your information to create your secure vault
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Your name"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="john.doe@example.com"
                            type="email"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field with strength indicator */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Master Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              calculatePasswordStrength(e.target.value);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {field.value && (
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Password strength:</span>
                            <span
                              className={
                                passwordStrength <= 25
                                  ? "text-destructive"
                                  : passwordStrength <= 50
                                    ? "text-amber-500"
                                    : passwordStrength <= 75
                                      ? "text-yellow-500"
                                      : "text-green-500"
                              }
                            >
                              {passwordStrength <= 25
                                ? "Weak"
                                : passwordStrength <= 50
                                  ? "Fair"
                                  : passwordStrength <= 75
                                    ? "Good"
                                    : "Strong"}
                            </span>
                          </div>
                          <Progress value={passwordStrength} className="h-1" />
                        </div>
                      )}
                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase,
                        number and special character.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Master Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="••••••••"
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <LoadingButton
                  type="submit"
                  pending={pending}
                  className="w-full bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Create Account
                </LoadingButton>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-0">
            <Alert className="mb-6 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                By creating an account, you acknowledge that we cannot retrieve
                your master password. Please ensure you remember it, Agree to
                our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-black/80 dark:hover:text-white/80"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-black/80 dark:hover:text-white/80"
                >
                  Privacy Policy
                </Link>
                .
              </AlertDescription>
            </Alert>
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-black dark:text-white underline underline-offset-4 hover:text-black/80 dark:hover:text-white/80"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Gradient background */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-800 to-zinc-700 dark:from-black dark:via-zinc-900 dark:to-zinc-800">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.15) 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Secure Password Manager
              </h2>
              <p className="text-lg text-zinc-300">
                Keep all your credentials safe and accessible across all your
                devices with industry-leading encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
