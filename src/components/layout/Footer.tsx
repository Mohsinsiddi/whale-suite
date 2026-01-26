import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-lg">🐋</span>
              <span className="font-bold text-base bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                WHALE SUITE
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed">
              Privacy-first trading tools for Solana whales. Built for Solana Privacy Hack 2026.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Product
            </h4>
            <div className="space-y-2">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/docs/api">API</FooterLink>
            </div>
          </div>

          {/* Privacy SDKs */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Privacy SDKs
            </h4>
            <div className="space-y-2">
              <FooterLink href="#">Privacy Cash</FooterLink>
              <FooterLink href="#">ShadowWire</FooterLink>
              <FooterLink href="#">PNP Exchange</FooterLink>
              <FooterLink href="#">Helius RPC</FooterLink>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Connect
            </h4>
            <div className="space-y-2">
              <FooterLink href="#">Twitter</FooterLink>
              <FooterLink href="#">Discord</FooterLink>
              <FooterLink href="#">GitHub</FooterLink>
              <FooterLink href="#">Telegram</FooterLink>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            © 2026 Whale Trading Suite. Built with privacy in mind.
          </p>
          <div className="flex items-center gap-4">
            <FooterLink href="/privacy" small>Privacy Policy</FooterLink>
            <FooterLink href="/terms" small>Terms of Service</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  small = false,
}: {
  href: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block text-text-secondary hover:text-neon-green transition-colors ${
        small ? "text-xs" : "text-sm"
      }`}
    >
      {children}
    </Link>
  );
}
