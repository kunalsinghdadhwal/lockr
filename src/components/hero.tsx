import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import { FullWidthDivider } from "@/components/ui/full-width-divider";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, Lock, Shield } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
	return (
		<section>
			<div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-4 md:py-24 lg:py-28">
				{/* X Faded Borders & Shades */}
				<div
					aria-hidden="true"
					className="absolute inset-0 -z-1 size-full overflow-hidden"
				>
					<div
						className={cn(
							"absolute -inset-x-20 inset-y-0 z-0 rounded-full",
							"bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]",
							"blur-[50px]"
						)}
					/>
					<div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
					<div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
					<div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
					<div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
				</div>
				<a
					className={cn(
						"group mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1 shadow",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out"
					)}
					href="#features"
				>
					<div className="rounded-xs border bg-card px-1.5 py-0.5 shadow-sm">
						<p className="font-mono text-xs">NEW</p>
					</div>

					<span className="text-xs">End-to-end encrypted vault</span>
					<span className="block h-5 border-l" />

					<div className="pr-1">
						<ArrowRightIcon className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
					</div>
				</a>

				<h1
					className={cn(
						"max-w-2xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
					)}
				>
					Secure Your Digital Life with One Master Password
				</h1>

				<p
					className={cn(
						"text-center text-muted-foreground text-sm tracking-wider sm:text-lg",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
					)}
				>
					Store, generate, and manage passwords with <br /> military-grade
					AES-256 encryption.
				</p>

				<div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
					<Link href="#features">
						<Button variant="outline">
							Learn More
						</Button>
					</Link>
					<Link href="/sign-up">
						<Button>
							Get Started{" "}
							<ArrowRightIcon data-icon="inline-end" />
						</Button>
					</Link>
				</div>
			</div>
			<div className="relative">
				<DecorIcon className="size-4" position="top-left" />
				<DecorIcon className="size-4" position="top-right" />
				<DecorIcon className="size-4" position="bottom-left" />
				<DecorIcon className="size-4" position="bottom-right" />

				<FullWidthDivider className="-top-px" />
				<div className="overflow-hidden rounded-lg border border-border/50 mx-4 md:mx-8 lg:mx-12">
					<div className="bg-zinc-950 p-4 md:p-6">
						<div className="flex items-center justify-between border-b border-white/10 pb-3">
							<div className="flex items-center gap-2">
								<Lock className="h-5 w-5 text-white" />
								<span className="font-medium text-white">My Vault</span>
							</div>
							<div className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-emerald-400" />
								<span className="text-xs text-emerald-400 font-mono">ENCRYPTED</span>
							</div>
						</div>
						<div className="mt-4 space-y-3">
							{[
								{ name: "GitHub", user: "dev@example.com" },
								{ name: "AWS Console", user: "admin@company.io" },
								{ name: "Figma", user: "design@studio.co" },
								{ name: "Vercel", user: "deploy@team.dev" },
							].map((item) => (
								<div
									key={item.name}
									className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2.5 border border-white/[0.04]"
								>
									<div>
										<div className="text-sm font-medium text-white/90">
											{item.name}
										</div>
										<div className="text-xs text-white/40 font-mono">
											{item.user}
										</div>
									</div>
									<div className="text-xs text-white/20 font-mono tracking-wider">
										************
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<FullWidthDivider className="-bottom-px" />
			</div>
		</section>
	);
}
