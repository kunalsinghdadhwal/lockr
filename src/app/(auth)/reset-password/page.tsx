"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/zod";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import type { z } from "zod";

import { Logo } from "@/components/logo";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import LoadingButton from "@/components/loading-button";

function ResetPasswordContent() {
	const router = useRouter();
	const { toast } = useToast();
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	const [isPending, setIsPending] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm<z.infer<typeof resetPasswordSchema>>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
		setIsPending(true);
		const { error } = await authClient.resetPassword({
			newPassword: data.password,
		});
		if (error) {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "Password reset successful. Login to continue.",
			});
			router.push("/sign-in");
		}
		setIsPending(false);
	};

	if (error === "invalid_token") {
		return (
			<div className="mx-auto space-y-4 sm:w-sm">
				<Logo className="h-4.5 lg:hidden" />
				<div className="flex flex-col space-y-1">
					<h1 className="font-bold text-2xl tracking-wide">
						Invalid Reset Link
					</h1>
					<p className="text-base text-muted-foreground">
						This password reset link is invalid or has expired. Please request a
						new one.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto space-y-4 sm:w-sm">
			<Logo className="h-4.5 lg:hidden" />
			<div className="flex flex-col space-y-1">
				<h1 className="font-bold text-2xl tracking-wide">Reset password</h1>
				<p className="text-base text-muted-foreground">
					Enter your new password below.
				</p>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="New password"
							type={showPassword ? "text" : "password"}
							{...form.register("password")}
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
					{form.formState.errors.password && (
						<p className="text-xs text-destructive">
							{form.formState.errors.password.message}
						</p>
					)}
				</div>

				<div className="space-y-1">
					<InputGroup>
						<InputGroupInput
							placeholder="Confirm new password"
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

				<LoadingButton pending={isPending}>Reset Password</LoadingButton>
			</form>
		</div>
	);
}

export default function ResetPassword() {
	return (
		<Suspense>
			<ResetPasswordContent />
		</Suspense>
	);
}
