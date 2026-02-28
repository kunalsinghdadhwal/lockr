"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/zod";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { AtSignIcon } from "lucide-react";
import type { z } from "zod";

import { Logo } from "@/components/logo";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import LoadingButton from "@/components/loading-button";

export default function ForgotPassword() {
	const { toast } = useToast();
	const [isPending, setIsPending] = useState(false);

	const form = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
		setIsPending(true);
		const { error } = await authClient.requestPasswordReset({
			email: data.email,
			redirectTo: "/reset-password",
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
				description:
					"If an account exists with this email, you will receive a password reset link.",
			});
		}
		setIsPending(false);
	};

	return (
		<div className="mx-auto space-y-4 sm:w-sm">
			<Logo className="h-4.5 lg:hidden" />
			<div className="flex flex-col space-y-1">
				<h1 className="font-bold text-2xl tracking-wide">Forgot password</h1>
				<p className="text-base text-muted-foreground">
					Enter your email and we will send you a reset link.
				</p>
			</div>

			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-2"
			>
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

				<LoadingButton pending={isPending}>Send Reset Link</LoadingButton>
			</form>

			<p className="text-muted-foreground text-sm">
				Remember your password?{" "}
				<Link
					className="underline underline-offset-4 hover:text-foreground"
					href="/sign-in"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}
