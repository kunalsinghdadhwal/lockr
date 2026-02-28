"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
	AtSignIcon,
	LockIcon,
	UserIcon,
	EyeIcon,
	EyeOffIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
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
import { REGEXP_ONLY_DIGITS } from "input-otp";
import LoadingButton from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type SignUpValues = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
};

type Step = "register" | "verify-otp";

export default function SignUpPage() {
	const router = useRouter();
	const { toast } = useToast();

	const [step, setStep] = useState<Step>("register");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [pending, setPending] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [resending, setResending] = useState(false);

	const form = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const calculatePasswordStrength = (password: string) => {
		let strength = 0;
		if (password.length >= 8) strength += 25;
		if (/[A-Z]/.test(password)) strength += 25;
		if (/[a-z]/.test(password)) strength += 25;
		if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))
			strength += 25;
		setPasswordStrength(strength);
	};

	const onSubmit = async (values: SignUpValues) => {
		setPending(true);
		await authClient.signUp.email(
			{
				email: values.email,
				password: values.password,
				name: values.name,
			},
			{
				onSuccess: async () => {
					setEmail(values.email);
					await authClient.emailOtp.sendVerificationOtp({
						email: values.email,
						type: "email-verification",
					});
					setStep("verify-otp");
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
		setPending(false);
	};

	const handleVerifyOtp = async () => {
		setVerifying(true);
		const { error } = await authClient.emailOtp.verifyEmail({
			email,
			otp,
		});
		if (error) {
			toast({
				title: "Verification failed",
				description: error.message ?? "Invalid or expired code.",
				variant: "destructive",
			});
		} else {
			router.push("/dashboard");
			router.refresh();
		}
		setVerifying(false);
	};

	const handleResendOtp = async () => {
		setResending(true);
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});
		if (error) {
			toast({
				title: "Failed to resend",
				description: error.message ?? "Could not resend code.",
				variant: "destructive",
			});
		} else {
			toast({
				title: "Code sent",
				description: "A new verification code has been sent to your email.",
			});
		}
		setResending(false);
	};

	const passwordValue = form.watch("password");

	if (step === "verify-otp") {
		return (
			<div className="mx-auto space-y-6 sm:w-sm">
				<Logo className="h-4.5 lg:hidden" />
				<div className="flex flex-col space-y-1">
					<h1 className="font-bold text-2xl tracking-wide">
						Check your email
					</h1>
					<p className="text-base text-muted-foreground">
						We sent a 6-digit code to{" "}
						<span className="font-medium text-foreground">{email}</span>
					</p>
				</div>

				<div className="flex flex-col items-center space-y-4">
					<InputOTP
						maxLength={6}
						pattern={REGEXP_ONLY_DIGITS}
						value={otp}
						onChange={setOtp}
						onComplete={handleVerifyOtp}
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
						onClick={handleVerifyOtp}
						disabled={otp.length < 6}
					>
						Verify
					</LoadingButton>
				</div>

				<p className="text-center text-muted-foreground text-sm">
					Didn&apos;t receive a code?{" "}
					<Button
						variant="link"
						className="h-auto p-0 text-sm underline underline-offset-4"
						onClick={handleResendOtp}
						disabled={resending}
					>
						{resending ? "Sending..." : "Resend code"}
					</Button>
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto space-y-4 sm:w-sm">
			<Logo className="h-4.5 lg:hidden" />
			<div className="flex flex-col space-y-1">
				<h1 className="font-bold text-2xl tracking-wide">Create account</h1>
				<p className="text-base text-muted-foreground">
					Set up your secure vault in seconds.
				</p>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="Your name"
							type="text"
							{...form.register("name")}
						/>
						<InputGroupAddon align="inline-start">
							<UserIcon />
						</InputGroupAddon>
					</InputGroup>
					{form.formState.errors.name && (
						<p className="text-xs text-destructive">
							{form.formState.errors.name.message}
						</p>
					)}
				</div>

				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="your.email@example.com"
							type="email"
							{...form.register("email")}
						/>
						<InputGroupAddon align="inline-start">
							<AtSignIcon />
						</InputGroupAddon>
					</InputGroup>
					{form.formState.errors.email && (
						<p className="text-xs text-destructive">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>

				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="Password"
							type={showPassword ? "text" : "password"}
							{...form.register("password", {
								onChange: (e) => calculatePasswordStrength(e.target.value),
							})}
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
					{passwordValue && (
						<div className="space-y-1">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">
									Password strength:
								</span>
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
					{form.formState.errors.password && (
						<p className="text-xs text-destructive">
							{form.formState.errors.password.message}
						</p>
					)}
				</div>

				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="Confirm password"
							type={showConfirmPassword ? "text" : "password"}
							{...form.register("confirmPassword")}
						/>
						<InputGroupAddon align="inline-start">
							<LockIcon />
						</InputGroupAddon>
						<InputGroupAddon align="inline-end">
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="text-muted-foreground hover:text-foreground"
								aria-label={
									showConfirmPassword ? "Hide password" : "Show password"
								}
							>
								{showConfirmPassword ? (
									<EyeOffIcon className="size-4" />
								) : (
									<EyeIcon className="size-4" />
								)}
							</button>
						</InputGroupAddon>
					</InputGroup>
					{form.formState.errors.confirmPassword && (
						<p className="text-xs text-destructive">
							{form.formState.errors.confirmPassword.message}
						</p>
					)}
				</div>

				<LoadingButton pending={pending}>Create account</LoadingButton>
			</form>

			<p className="text-muted-foreground text-sm">
				Already have an account?{" "}
				<Link
					className="underline underline-offset-4 hover:text-foreground"
					href="/sign-in"
				>
					Sign in
				</Link>
			</p>
			<p className="text-muted-foreground text-xs">
				By creating an account, you agree to our{" "}
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
