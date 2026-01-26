"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input, { AmountInput } from "@/components/ui/Input";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";

export default function TransferPage() {
  const [activeTab, setActiveTab] = useState("private");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tabs = [
    { id: "private", label: "Private Transfer", icon: <GhostIcon /> },
    { id: "internal", label: "Internal Transfer", icon: <TransferIcon /> },
  ];

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = [
    { label: "Preparing transaction", status: getStepStatus(0) },
    { label: "Encrypting amount", status: getStepStatus(1) },
    { label: "Broadcasting", status: getStepStatus(2) },
  ];

  const handleSend = () => {
    setShowTxModal(true);
    setCurrentStep(0);

    // Simulate transaction steps
    setTimeout(() => setCurrentStep(1), 1500);
    setTimeout(() => setCurrentStep(2), 3000);
    setTimeout(() => {
      setShowTxModal(false);
      setShowSuccessModal(true);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Ghost Send</h1>
        <p className="text-sm text-text-secondary">Send funds privately via ShadowWire</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="lg">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
              size="sm"
            />

            <TabPanel value="private" activeValue={activeTab} className="mt-6">
              <div className="space-y-5">
                {/* From Vault */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    From Vault
                  </label>
                  <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-sm">
                          M
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">Main Vault</div>
                          <div className="text-xs text-text-muted font-mono">0x4f2e...8a3b</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-green">380.2 SOL</div>
                        <div className="text-xs text-text-muted">Hidden Balance</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <Input
                  label="Recipient Address"
                  placeholder="Enter Solana address or ENS"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />

                {/* Amount */}
                <AmountInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  balance="380.2 SOL"
                  onMaxClick={() => setAmount("380.2")}
                />

                {/* Privacy Info */}
                <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                  <div className="flex items-start gap-2">
                    <ShieldIcon className="w-4 h-4 text-neon-green mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-neon-green mb-1">Private Transfer</p>
                      <p className="text-xs text-text-secondary">
                        Amount will be hidden using zero-knowledge proofs. Only you and the recipient will know the amount.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Estimate */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Estimated Fee</span>
                  <span className="text-text-secondary">~0.001 SOL</span>
                </div>

                <Button fullWidth onClick={handleSend} disabled={!amount || !recipient}>
                  Send Privately
                </Button>
              </div>
            </TabPanel>

            <TabPanel value="internal" activeValue={activeTab} className="mt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* From Vault */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">From</label>
                    <select className="w-full px-3 py-2.5 text-sm bg-bg-tertiary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-neon-green">
                      <option>Main Vault</option>
                      <option>Trading Vault</option>
                      <option>Savings</option>
                    </select>
                  </div>
                  {/* To Vault */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">To</label>
                    <select className="w-full px-3 py-2.5 text-sm bg-bg-tertiary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-neon-green">
                      <option>Trading Vault</option>
                      <option>Main Vault</option>
                      <option>Savings</option>
                    </select>
                  </div>
                </div>

                <AmountInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  balance="380.2 SOL"
                  onMaxClick={() => setAmount("380.2")}
                />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Network Fee</span>
                  <span className="text-neon-green">FREE (Internal)</span>
                </div>

                <Button fullWidth disabled={!amount}>Transfer Between Vaults</Button>
              </div>
            </TabPanel>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Transfers */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Recent Transfers</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { to: "0x7c1d...2e5f", amount: "50 SOL", time: "2h ago", type: "private" },
                { to: "0x9a3b...1c4d", amount: "25 SOL", time: "1d ago", type: "internal" },
                { to: "0x2d5e...9f1a", amount: "100 SOL", time: "3d ago", type: "private" },
              ].map((tx, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary">{tx.to}</span>
                    <Badge size="xs" variant={tx.type === "private" ? "default" : "cyan"}>
                      {tx.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{tx.amount}</span>
                    <span className="text-xs text-text-muted">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Privacy Tips */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Privacy Tips</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs text-text-secondary">
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Use different vaults for different purposes</p>
              </div>
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Wait random intervals between transfers</p>
              </div>
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Split large amounts into smaller transfers</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title="Sending Privately..."
        steps={txSteps}
        currentStep={currentStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Transfer Complete!"
        message={`Successfully sent ${amount} SOL privately`}
        txSignature="5xYz...abc123"
      />
    </div>
  );
}

// Icons
const GhostIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const TransferIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
