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
            <div className="flex items-center justify-center gap-6">
              {/* Phantom */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#AB9FF2] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
                    <path d="M110.584 64.7158C110.584 99.0921 83.2242 126.835 49.3188 126.835C15.4134 126.835 -11.9463 99.0921 -11.9463 64.7158C-11.9463 30.3395 15.4134 2.59668 49.3188 2.59668C83.2242 2.59668 110.584 30.3395 110.584 64.7158Z" fill="url(#paint0_linear)"/>
                    <path d="M89.4337 63.6241C89.4337 77.6987 78.0186 89.1138 63.944 89.1138C63.0957 89.1138 62.2581 89.0705 61.4337 88.9865C61.9757 82.6345 61.6357 75.2745 58.5737 67.9625C54.2457 57.6265 44.5817 52.5105 34.0737 52.5105C30.5337 52.5105 27.1257 53.0745 23.9577 54.1145C27.5337 40.1665 40.2377 29.9065 55.4337 29.9065C73.2277 29.9065 87.6897 43.4905 89.2977 60.8545C89.3897 61.7665 89.4337 62.6905 89.4337 63.6241Z" fill="url(#paint1_linear)"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="49.3188" y1="2.59668" x2="49.3188" y2="126.835" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#534BB1"/>
                        <stop offset="1" stopColor="#551BF9"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear" x1="56.6957" y1="29.9065" x2="56.6957" y2="89.1138" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white"/>
                        <stop offset="1" stopColor="white" stopOpacity="0.82"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-[10px] text-text-muted">Phantom</span>
              </div>

              {/* Solflare */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FC7227] to-[#FDB72C] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-[10px] text-text-muted">Solflare</span>
              </div>

              {/* Backpack */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#E33E3F] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3C9.79 3 8 4.79 8 7V8H6C4.9 8 4 8.9 4 10V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V10C20 8.9 19.1 8 18 8H16V7C16 4.79 14.21 3 12 3ZM12 5C13.1 5 14 5.9 14 7V8H10V7C10 5.9 10.9 5 12 5ZM12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-[10px] text-text-muted">Backpack</span>
              </div>

              {/* Coinbase */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="white"/>
                    <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15Z" fill="#0052FF"/>
                  </svg>
                </div>
                <span className="text-[10px] text-text-muted">Coinbase</span>
              </div>
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
