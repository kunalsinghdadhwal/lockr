import { cn } from "@/lib/utils";
import {
	Shield,
	Zap,
	Lock,
	EyeOff,
	Globe,
	ShieldCheck,
	type LucideIcon,
} from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
	{
		icon: Shield,
		title: "Password Generator",
		description:
			"Generate strong, unique passwords with customizable length, symbols, and entropy analysis.",
	},
	{
		icon: Zap,
		title: "Auto-Fill",
		description:
			"Seamlessly fill credentials across browsers and devices with one click.",
	},
	{
		icon: Lock,
		title: "Secure Vault",
		description:
			"AES-256-GCM encrypted storage ensures your data is protected with military-grade encryption.",
	},
	{
		icon: EyeOff,
		title: "Zero-Knowledge Architecture",
		description:
			"Your master password never leaves your device. We cannot access your data, ever.",
	},
	{
		icon: Globe,
		title: "Cross-Device Sync",
		description:
			"Access your vault from any device with end-to-end encrypted sync.",
	},
	{
		icon: ShieldCheck,
		title: "Two-Factor Auth",
		description:
			"Add TOTP or FIDO2 hardware key authentication for an extra layer of security.",
	},
];

export function FeatureSection() {
	return (
		<section id="features" className="relative py-16 md:py-24">
			<div className="mx-auto max-w-5xl px-4 md:px-6">
				<div className="mb-12 flex flex-col items-center text-center">
					<div className="mb-4 rounded-sm border bg-card px-3 py-1 text-xs font-medium shadow-sm">
						Features
					</div>
					<h2 className="text-3xl text-foreground md:text-4xl">
						Everything you need to stay secure
					</h2>
					<p className="mt-3 max-w-xl text-muted-foreground text-sm sm:text-base">
						Lockr combines military-grade encryption with a seamless user
						experience.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
					{features.map((feature) => (
						<FeatureCard key={feature.title} {...feature} />
					))}
				</div>
			</div>
		</section>
	);
}

function FeatureCard({
	icon: Icon,
	title,
	description,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
}) {
	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-2xl border bg-background px-6 pt-6 pb-5"
			)}
		>
			<div className="mb-4 flex size-10 items-center justify-center rounded-full border bg-card shadow-xs">
				<Icon className="size-5 text-primary/80" />
			</div>
			<FeatureTitle>{title}</FeatureTitle>
			<FeatureDescription className="mt-1.5">{description}</FeatureDescription>
		</div>
	);
}

function FeatureTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return (
		<h3
			className={cn("font-medium text-foreground text-lg", className)}
			{...props}
		/>
	);
}

function FeatureDescription({
	className,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p className={cn("text-muted-foreground text-sm", className)} {...props} />
	);
}
