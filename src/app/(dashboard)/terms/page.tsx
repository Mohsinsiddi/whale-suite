'use client';

import Card from '@/components/ui/Card';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Terms & Conditions</h1>
            <p className="text-text-muted text-sm">Last updated: February 2026</p>
          </div>
        </div>
      </div>

      {/* Important Warning */}
      <Card className="p-6 mb-6 border-warning/30 bg-warning/5">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-warning mb-2">Important Risk Disclosure</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Whale Suite is a <strong>beta/experimental platform</strong> on Solana mainnet. By using this service,
              you acknowledge that you are using it at your own risk. We strongly recommend starting with
              <strong> small amounts</strong> to test functionality before committing larger sums.
            </p>
          </div>
        </div>
      </Card>

      {/* Terms Content */}
      <Card className="p-6 space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">1. Acceptance of Terms</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            By accessing or using Whale Suite (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions.
            If you do not agree to these terms, do not use the Platform. These terms apply to all users,
            including visitors, registered users, and contributors.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">2. Beta/Experimental Status</h2>
          <ul className="text-text-secondary text-sm leading-relaxed space-y-2 list-disc pl-5">
            <li>The Platform is currently in <strong>beta</strong> and operates on Solana mainnet.</li>
            <li>Features may be unstable, contain bugs, or behave unexpectedly.</li>
            <li>We strongly recommend <strong>testing with small amounts first</strong>.</li>
            <li>Do not use amounts you cannot afford to lose.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">3. Assumption of Risk</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            You acknowledge and accept the following risks:
          </p>
          <ul className="text-text-secondary text-sm leading-relaxed space-y-2 list-disc pl-5">
            <li><strong>Financial Loss:</strong> Cryptocurrency transactions are irreversible. Lost funds cannot be recovered.</li>
            <li><strong>Smart Contract Risk:</strong> The Platform interacts with third-party smart contracts and SDKs that may contain vulnerabilities.</li>
            <li><strong>Third-Party Services:</strong> Features like Virtual Cards (StarPay), Privacy Cash, and Darklake are provided by third parties. We are not responsible for their service availability or failures.</li>
            <li><strong>Regulatory Risk:</strong> Cryptocurrency regulations vary by jurisdiction. You are responsible for compliance with your local laws.</li>
            <li><strong>Technical Failures:</strong> Network congestion, RPC failures, or blockchain issues may affect transactions.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">4. Third-Party Services</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform integrates with various third-party services:
          </p>
          <ul className="text-text-secondary text-sm leading-relaxed space-y-2 list-disc pl-5">
            <li><strong>StarPay:</strong> Virtual card issuance. Subject to their own terms at <a href="https://starpay.cards" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">starpay.cards</a></li>
            <li><strong>Jupiter:</strong> Token swaps and routing</li>
            <li><strong>Darklake:</strong> Private swaps with ZK proofs</li>
            <li><strong>Light Protocol / Privacy Cash:</strong> Shielded transactions</li>
            <li><strong>INCO Network:</strong> Confidential channels with FHE</li>
            <li><strong>Helius:</strong> RPC and blockchain data</li>
          </ul>
          <p className="text-text-secondary text-sm leading-relaxed mt-3">
            We are not responsible for the availability, accuracy, or security of these third-party services.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">5. Virtual Cards Disclaimer</h2>
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-3">
            <p className="text-warning text-sm font-medium">
              Virtual Cards are provided by StarPay, a third-party service.
            </p>
          </div>
          <ul className="text-text-secondary text-sm leading-relaxed space-y-2 list-disc pl-5">
            <li>Card orders may fail due to provider issues (e.g., insufficient balance on their end).</li>
            <li>If payment is sent and the order fails, contact StarPay support directly.</li>
            <li>Whale Suite does not process payments or issue cards directly.</li>
            <li>Refunds are subject to StarPay&apos;s policies.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">6. No Warranty</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE,
            OR SECURE.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">7. Limitation of Liability</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHALE SUITE AND ITS CONTRIBUTORS SHALL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
            LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE PLATFORM.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">8. User Responsibilities</h2>
          <ul className="text-text-secondary text-sm leading-relaxed space-y-2 list-disc pl-5">
            <li>Secure your wallet and private keys. We cannot recover lost funds.</li>
            <li>Verify all transaction details before signing.</li>
            <li>Use the Platform in compliance with applicable laws.</li>
            <li>Report bugs or security issues responsibly.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">9. Changes to Terms</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            We may update these Terms at any time. Continued use of the Platform after changes constitutes
            acceptance of the new terms. Check this page periodically for updates.
          </p>
        </section>

        {/* Section 10 */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">10. Contact & Support</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            For questions about these terms or to report issues:
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://github.com/anthropics/whale-suite"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-text-muted/10 text-text-secondary text-xs font-medium hover:bg-text-muted/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              GitHub
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green text-xs font-medium hover:bg-neon-green/20 transition-colors"
            >
              Documentation
            </Link>
          </div>
        </section>
      </Card>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-neon-green transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
