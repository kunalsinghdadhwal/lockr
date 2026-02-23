"use client";

import Link from "next/link";
import { Check, X, ArrowRight, Zap, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started with secure password management.",
    cta: "Get Started",
    ctaHref: "/sign-up",
    highlight: false,
    features: [
      { text: "50 encrypted vault entries", included: true },
      { text: "End-to-end encryption (AES-256-GCM)", included: true },
      { text: "PBKDF2 key derivation (600k iterations)", included: true },
      { text: "Password generator (basic)", included: true },
      { text: "2FA for account (TOTP)", included: true },
      { text: "Import / export vault", included: true },
      { text: "2 active sessions", included: true },
      { text: "Community support", included: true },
      { text: "Argon2id (memory-hard KDF)", included: false },
      { text: "Recovery key", included: false },
      { text: "Unlimited entries", included: false },
      { text: "Breach monitoring", included: false },
      { text: "Priority email support", included: false },
    ],
  },
  {
    name: "Premium",
    price: "$4",
    period: "/month",
    description: "Maximum security and unlimited storage for power users.",
    cta: "Upgrade to Premium",
    ctaAction: "checkout",
    highlight: true,
    features: [
      { text: "Unlimited encrypted vault entries", included: true },
      { text: "End-to-end encryption (AES-256-GCM)", included: true },
      { text: "Argon2id key derivation (memory-hard)", included: true },
      { text: "Password generator (advanced)", included: true },
      { text: "2FA for account (TOTP + FIDO2)", included: true },
      { text: "Import / export vault", included: true },
      { text: "Unlimited active sessions", included: true },
      { text: "Priority email support", included: true },
      { text: "Recovery key (master password backup)", included: true },
      { text: "Vault health report (full breakdown)", included: true },
      { text: "Breach monitoring + email alerts", included: true },
      { text: "Password history (last 25 versions)", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
] as const;

export default function PricingPage() {
  const handleCheckout = async () => {
    // @ts-expect-error -- polar plugin types
    await authClient.polar.checkout({ slug: "premium" });
  };

  return (
    <>
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.03] text-zinc-400 uppercase tracking-widest text-[10px] px-3 py-1"
            >
              Pricing
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="max-w-[600px] text-gray-400 md:text-lg">
              Start free. Upgrade when you need maximum security, unlimited
              entries, and premium features.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  tier.highlight
                    ? "border-white/20 bg-white/[0.03] shadow-[0_0_60px_-12px_rgba(255,255,255,0.08)]"
                    : "border-white/[0.06] bg-white/[0.01]"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-white text-black text-[10px] font-semibold uppercase tracking-widest px-3 py-1 hover:bg-white">
                      <Zap className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-200">
                    {tier.name}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-sm text-zinc-500">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                      ) : (
                        <X className="h-4 w-4 mt-0.5 shrink-0 text-zinc-700" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {"ctaHref" in tier ? (
                  <Link href={tier.ctaHref}>
                    <Button
                      variant="outline"
                      className="w-full h-11 border-white/10 text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    >
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleCheckout}
                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-medium"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {tier.cta}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-3xl mt-20">
            <h2 className="text-xl font-bold text-center mb-8 text-zinc-200">
              Detailed Feature Comparison
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="py-3 px-4 text-left font-medium text-zinc-400">
                      Feature
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-zinc-400 w-28">
                      Free
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-zinc-400 w-28">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    ["Vault entries", "50", "Unlimited"],
                    ["KDF algorithm", "PBKDF2", "Argon2id"],
                    ["Recovery key", "--", "Yes"],
                    ["Active sessions", "2", "Unlimited"],
                    ["Password generator", "Basic", "Advanced"],
                    ["Vault health report", "Score only", "Full breakdown"],
                    ["Breach monitoring", "--", "Continuous"],
                    ["Password history", "--", "25 versions"],
                    ["FIDO2 / hardware keys", "--", "Yes"],
                    ["Priority support", "--", "Yes"],
                    ["Early access", "--", "Yes"],
                  ].map(([feature, free, premium]) => (
                    <tr
                      key={feature}
                      className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-4 text-zinc-300">{feature}</td>
                      <td className="py-2.5 px-4 text-center text-zinc-500">
                        {free}
                      </td>
                      <td className="py-2.5 px-4 text-center text-zinc-300">
                        {premium}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
