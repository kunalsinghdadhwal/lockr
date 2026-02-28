"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/lib/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AtSignIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import type { z } from "zod";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp";
import LoadingButton from "@/components/loading-button";

type Step = "credentials" | "totp";

export default function SignInPage() {
	const router = useRouter();
	const { toast } = useToast();

	const [step, setStep] = useState<Step>("credentials");
	const [totpCode, setTotpCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [pendingCredentials, setPendingCredentials] = useState(false);
	const [pendingGithub, setPendingGithub] = useState(false);
	const [pendingGoogle, setPendingGoogle] = useState(false);
	const [verifying, setVerifying] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<z.infer<typeof signInSchema>>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleCredentialsSignIn = async (
		values: z.infer<typeof signInSchema>,
	) => {
		await authClient.signIn.email(
			{
				email: values.email,
				password: values.password,
			},
			{
				onRequest: () => {
					setPendingCredentials(true);
				},
				onSuccess: async (ctx) => {
					if (ctx.data.twoFactorRedirect) {
						setStep("totp");
					} else {
						router.push("/dashboard");
						router.refresh();
					}
				},
				onError: (ctx) => {
					toast({
						title: "Something went wrong",
						description: ctx.error.message ?? "Something went wrong.",
						variant: "destructive",
					});
				},
			},
		);
		setPendingCredentials(false);
	};

	const handleVerifyTotp = async () => {
		setVerifying(true);
		const { error } = await authClient.twoFactor.verifyTotp({
			code: totpCode,
		});
		if (error) {
			toast({
				title: "Verification failed",
				description: error.message ?? "Invalid code. Please try again.",
				variant: "destructive",
			});
		} else {
			router.push("/dashboard");
			router.refresh();
		}
		setVerifying(false);
	};

	const handleSignInWithGithub = async () => {
		setPendingGithub(true);
		await authClient.signIn.social({
			provider: "github",
			callbackURL: "/dashboard",
		});
		setPendingGithub(false);
	};

	const handleSignInWithGoogle = async () => {
		setPendingGoogle(true);
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/dashboard",
		});
		setPendingGoogle(false);
	};

	if (step === "totp") {
		return (
			<div className="mx-auto space-y-6 sm:w-sm">
				<Logo className="h-4.5 lg:hidden" />
				<div className="flex flex-col space-y-1">
					<h1 className="font-bold text-2xl tracking-wide">
						Two-factor authentication
					</h1>
					<p className="text-base text-muted-foreground">
						Enter the 6-digit code from your authenticator app.
					</p>
				</div>

				<div className="flex flex-col items-center space-y-4">
					<InputOTP
						maxLength={6}
						pattern={REGEXP_ONLY_DIGITS}
						value={totpCode}
						onChange={setTotpCode}
						onComplete={handleVerifyTotp}
						disabled={verifying}
					>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>

					<LoadingButton
						pending={verifying}
						onClick={handleVerifyTotp}
						disabled={totpCode.length < 6}
					>
						Verify
					</LoadingButton>
				</div>

				<p className="text-center text-muted-foreground text-sm">
					<Button
						variant="link"
						className="h-auto p-0 text-sm underline underline-offset-4"
						onClick={() => {
							setStep("credentials");
							setTotpCode("");
						}}
					>
						Back to sign in
					</Button>
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto space-y-4 sm:w-sm">
			<Logo className="h-4.5 lg:hidden" />
			<div className="flex flex-col space-y-1">
				<h1 className="font-bold text-2xl tracking-wide">Welcome back</h1>
				<p className="text-base text-muted-foreground">
					Sign in to access your secure vault.
				</p>
			</div>
			<div className="space-y-2">
				<Button
					className="w-full"
					variant="outline"
					onClick={handleSignInWithGoogle}
					disabled={pendingGoogle}
				>
					<GoogleIcon data-icon="inline-start" />
					{pendingGoogle ? "Connecting..." : "Continue with Google"}
				</Button>
				<Button
					className="w-full"
					variant="outline"
					onClick={handleSignInWithGithub}
					disabled={pendingGithub}
				>
					<GithubIcon data-icon="inline-start" />
					{pendingGithub ? "Connecting..." : "Continue with GitHub"}
				</Button>
			</div>

			<div className="flex w-full items-center justify-center">
				<div className="h-px w-full bg-border" />
				<span className="px-2 text-muted-foreground text-xs">OR</span>
				<div className="h-px w-full bg-border" />
			</div>

			<form
				onSubmit={handleSubmit(handleCredentialsSignIn)}
				className="space-y-2"
			>
				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="your.email@example.com"
							type="email"
							{...register("email")}
						/>
						<InputGroupAddon align="inline-start">
							<AtSignIcon />
						</InputGroupAddon>
					</InputGroup>
					{errors.email && (
						<p className="text-xs text-destructive">{errors.email.message}</p>
					)}
				</div>

				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="Password"
							type={showPassword ? "text" : "password"}
							{...register("password")}
						/>
						<InputGroupAddon align="inline-start">
							<LockIcon />
						</InputGroupAddon>
						<InputGroupAddon align="inline-end">
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-muted-foreground hover:text-foreground"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOffIcon className="size-4" />
								) : (
									<EyeIcon className="size-4" />
								)}
							</button>
						</InputGroupAddon>
					</InputGroup>
					{errors.password && (
						<p className="text-xs text-destructive">Password is required</p>
					)}
				</div>

				<div className="flex items-center justify-end">
					<Link
						href="/forgot-password"
						className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
					>
						Forgot password?
					</Link>
				</div>

				<LoadingButton pending={pendingCredentials}>Sign in</LoadingButton>
			</form>

			<p className="text-muted-foreground text-sm">
				Don&apos;t have an account?{" "}
				<Link
					className="underline underline-offset-4 hover:text-foreground"
					href="/sign-up"
				>
					Create an account
				</Link>
			</p>
			<p className="text-muted-foreground text-xs">
				By signing in, you agree to our{" "}
				<Link
					className="underline underline-offset-4 hover:text-foreground"
					href="/terms"
				>
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link
					className="underline underline-offset-4 hover:text-foreground"
					href="/privacy"
				>
					Privacy Policy
				</Link>
				.
			</p>
		</div>
	);
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
	<svg
		fill="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);

const GithubIcon = (props: React.ComponentProps<"svg">) => (
	<svg fill="currentColor" viewBox="0 0 1024 1024" {...props}>
		<path
			clipRule="evenodd"
			d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
			fill="currentColor"
			fillRule="evenodd"
			transform="scale(64)"
		/>
	</svg>
);
