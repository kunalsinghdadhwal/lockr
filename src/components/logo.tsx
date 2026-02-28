import { Lock } from "lucide-react";

export function Logo({ className }: { className?: string }) {
	return (
		<div className={className}>
			<div className="flex items-center gap-2">
				<Lock className="h-5 w-5" />
				<span className="font-bold text-lg">Lockr</span>
			</div>
		</div>
	);
}

export function LogoIcon({ className }: { className?: string }) {
	return <Lock className={className} />;
}
