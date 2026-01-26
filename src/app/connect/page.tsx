"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { useAuth } from "@/lib/privy/hooks";

export default function ConnectPage() {
  const router = useRouter();
  const { ready, authenticated, login, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  const handleConnect = () => {
    login();
  };

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-bg-primary">
        <div className="absolute inset-0 bg-gradient-radial opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">🐋</span>
          <span className="font-bold text-xl bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
            WHALE SUITE
          </span>
        </Link>

        <Card variant="glow" padding="lg">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Connect Wallet</h1>
            <p className="text-sm text-text-secondary">
              Choose your preferred method to continue
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full p-4 rounded-xl border bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-semibold transition-all hover:shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              "Connect Wallet"
            )}
          </button>

          {/* Supported Wallets */}
          <div className="text-center mb-6">
            <p className="text-xs text-text-muted mb-3">Supported wallets</p>
            <div className="flex items-center justify-center gap-4">
              {[
                { id: "phantom", icon: "👻", name: "Phantom" },
                { id: "solflare", icon: "🔆", name: "Solflare" },
                { id: "backpack", icon: "🎒", name: "Backpack" },
              ].map((wallet) => (
                <div key={wallet.id} className="flex flex-col items-center gap-1">
                  <span className="text-xl">{wallet.icon}</span>
                  <span className="text-[10px] text-text-muted">{wallet.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-secondary" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-text-muted bg-bg-tertiary">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Options Info */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { id: "google", icon: "G", name: "Google" },
              { id: "twitter", icon: "𝕏", name: "Twitter" },
              { id: "email", icon: "✉", name: "Email" },
            ].map((social) => (
              <button
                key={social.id}
                onClick={handleConnect}
                disabled={isLoading}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 transition-all disabled:opacity-50"
              >
                <span className="text-lg font-bold text-text-secondary">{social.icon}</span>
                <span className="text-xs text-text-muted">{social.name}</span>
              </button>
            ))}
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-text-muted">
            By connecting, you agree to our{" "}
            <Link href="/terms" className="text-neon-green hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-neon-green hover:underline">
              Privacy Policy
            </Link>
          </p>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🔒", label: "Private" },
            { icon: "⚡", label: "Fast" },
            { icon: "🛡️", label: "Secure" },
          ].map((feature, i) => (
            <div key={i} className="p-3">
              <div className="text-xl mb-1">{feature.icon}</div>
              <div className="text-xs text-text-muted">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
