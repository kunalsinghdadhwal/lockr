"use client";

import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import { FullWidthDivider } from "@/components/ui/full-width-divider";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Check, X, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const freeTierFeatures = [
	{ label: "50 encrypted vault entries", included: true },
	{ label: "AES-256-GCM encryption", included: true },
	{ label: "Password generator", included: true },
	{ label: "2FA (TOTP)", included: true },
	{ label: "Import/export vault", included: true },
	{ label: "2 active sessions", included: true },
];

const premiumTierFeatures = [
	{ label: "Unlimited vault entries", included: true },
	{ label: "Argon2id key derivation", included: true },
	{ label: "Advanced password generator", included: true },
	{ label: "Recovery key", included: true },
	{ label: "Breach monitoring + alerts", included: true },
	{ label: "Unlimited sessions", included: true },
];

export function PricingSection() {
	const handleCheckout = async () => {
		// @ts-expect-error -- polar plugin types
		await authClient.polar.checkout({ slug: "premium" });
	};

	return (
		<section id="pricing" className="relative py-16 md:py-24">
			<DecorIcon className="size-4" position="top-left" />
			<DecorIcon className="size-4" position="top-right" />
			<FullWidthDivider className="-top-px" />

			<div className="mx-auto max-w-5xl px-4 md:px-6">
				<div className="mb-12 flex flex-col items-center text-center">
					<div className="mb-4 rounded-sm border bg-card px-3 py-1 text-xs font-medium shadow-sm">
						Pricing
					</div>
					<h2 className="text-3xl text-foreground md:text-4xl">
						Simple, transparent pricing
					</h2>
					<p className="mt-3 max-w-xl text-muted-foreground text-sm sm:text-base">
						Start free. Upgrade when you need maximum security and unlimited
						storage.
					</p>
				</div>

				<div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
					{/* Free Tier */}
					<div className="relative overflow-hidden rounded-2xl border bg-background p-6">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-foreground">Free</h3>
							<div className="mt-2 flex items-baseline gap-1">
								<span className="text-4xl font-semibold text-foreground">
									$0
								</span>
								<span className="text-muted-foreground text-sm">/forever</span>
							</div>
						</div>

						<ul className="mb-8 space-y-3">
							{freeTierFeatures.map((feature) => (
								<li
									key={feature.label}
									className="flex items-center gap-2.5 text-sm"
								>
									{feature.included ? (
										<Check className="size-4 shrink-0 text-foreground" />
									) : (
										<X className="size-4 shrink-0 text-muted-foreground/50" />
									)}
									<span
										className={cn(
											feature.included
												? "text-foreground"
												: "text-muted-foreground/50"
										)}
									>
										{feature.label}
									</span>
								</li>
							))}
						</ul>

						<Link href="/sign-up" className="block">
							<Button variant="outline" className="w-full">
								Get Started
								<ArrowRight />
							</Button>
						</Link>
					</div>

					{/* Premium Tier */}
					<div
						className={cn(
							"relative overflow-hidden rounded-2xl border bg-background p-6",
							"border-border/80 shadow-[0_0_60px_-12px_rgba(255,255,255,0.08)]"
						)}
					>
						<div className="mb-6">
							<div className="mb-2 flex items-center gap-2">
								<h3 className="text-lg font-medium text-foreground">
									Premium
								</h3>
								<span className="inline-flex items-center gap-1 rounded-sm border bg-card px-2 py-0.5 text-xs font-medium shadow-sm">
									<Zap className="size-3" />
									Recommended
								</span>
							</div>
							<div className="mt-2 flex items-baseline gap-1">
								<span className="text-4xl font-semibold text-foreground">
									$4
								</span>
								<span className="text-muted-foreground text-sm">/month</span>
							</div>
						</div>

						<ul className="mb-8 space-y-3">
							{premiumTierFeatures.map((feature) => (
								<li
									key={feature.label}
									className="flex items-center gap-2.5 text-sm"
								>
									{feature.included ? (
										<Check className="size-4 shrink-0 text-foreground" />
									) : (
										<X className="size-4 shrink-0 text-muted-foreground/50" />
									)}
									<span
										className={cn(
											feature.included
												? "text-foreground"
												: "text-muted-foreground/50"
										)}
									>
										{feature.label}
									</span>
								</li>
							))}
						</ul>

						<Button className="w-full" onClick={handleCheckout}>
							Upgrade to Premium
							<ArrowRight />
						</Button>
					</div>
				</div>

				<div className="mt-6 text-center">
					<Link
						href="/pricing"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						See full comparison
					</Link>
				</div>
			</div>

			<DecorIcon className="size-4" position="bottom-left" />
			<DecorIcon className="size-4" position="bottom-right" />
			<FullWidthDivider className="-bottom-px" />
		</section>
	);
}
