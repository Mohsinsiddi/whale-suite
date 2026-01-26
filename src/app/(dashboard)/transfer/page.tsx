"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input, { AmountInput } from "@/components/ui/Input";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useTransfer, useWalletBalance } from "@/hooks";
import { useAuth } from "@/lib/privy/hooks";
import { TransferType } from "@/lib/privacy-sdks";

export default function TransferPage() {
  const { walletAddress } = useAuth();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    executeTransfer,
    estimateTransfer,
    validateAddress,
    loading: transferLoading,
    result: transferResult,
    estimate,
    error: transferError,
    reset: resetTransfer,
  } = useTransfer();

  const [activeTab, setActiveTab] = useState("private");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const tabs = [
    { id: "private", label: "Private Transfer", icon: <GhostIcon /> },
    { id: "standard", label: "Standard Transfer", icon: <TransferIcon /> },
  ];

  // Validate recipient on change
  useEffect(() => {
    if (recipient && !validateAddress(recipient)) {
      setRecipientError("Invalid Solana address");
    } else {
      setRecipientError(null);
    }
  }, [recipient, validateAddress]);

  // Estimate fee when amount/type changes
  useEffect(() => {
    if (amount && recipient && validateAddress(recipient)) {
      const type: TransferType = activeTab === "private" ? "private" : "standard";
      estimateTransfer(recipient, parseFloat(amount), type);
    }
  }, [amount, recipient, activeTab, estimateTransfer, validateAddress]);

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = activeTab === "private"
    ? [
        { label: "Preparing transaction", status: getStepStatus(0) },
        { label: "Encrypting amount", status: getStepStatus(1) },
        { label: "Broadcasting to network", status: getStepStatus(2) },
      ]
    : [
        { label: "Building transaction", status: getStepStatus(0) },
        { label: "Signing with wallet", status: getStepStatus(1) },
        { label: "Confirming on chain", status: getStepStatus(2) },
      ];

  const handleSend = async () => {
    if (!amount || !recipient || recipientError) return;

    setShowTxModal(true);
    setCurrentStep(0);

    // Step 1: Preparing
    await new Promise((r) => setTimeout(r, 500));
    setCurrentStep(1);

    // Step 2: Execute transfer
    const type: TransferType = activeTab === "private" ? "private" : "standard";
    const result = await executeTransfer(recipient, parseFloat(amount), type);

    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 500));

    setShowTxModal(false);

    if (result?.success) {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount("");
    setRecipient("");
    resetTransfer();
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
                {/* From Wallet */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    From Wallet
                  </label>
                  <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-sm">
                          W
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">Connected Wallet</div>
                          <div className="text-xs text-text-muted font-mono">
                            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-green">
                          {balanceLoading ? '...' : `${balance.toFixed(4)} SOL`}
                        </div>
                        <div className="text-xs text-text-muted">Available</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <Input
                  label="Recipient Address"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  error={recipientError || undefined}
                />

                {/* Amount */}
                <AmountInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  balance={`${balance.toFixed(4)} SOL`}
                  onMaxClick={() => setAmount((balance - 0.001).toFixed(4))}
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
                  <span className="text-text-secondary">
                    ~{estimate?.fee?.toFixed(6) || '0.00005'} SOL
                  </span>
                </div>

                {/* Error Display */}
                {transferError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="text-xs text-error">{transferError}</p>
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={handleSend}
                  disabled={!amount || !recipient || !!recipientError || transferLoading || parseFloat(amount) > balance}
                  loading={transferLoading}
                >
                  {transferLoading ? 'Sending...' : 'Send Privately'}
                </Button>
              </div>
            </TabPanel>

            <TabPanel value="standard" activeValue={activeTab} className="mt-6">
              <div className="space-y-5">
                {/* From Wallet */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    From Wallet
                  </label>
                  <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-teal flex items-center justify-center text-bg-primary font-bold text-sm">
                          W
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">Connected Wallet</div>
                          <div className="text-xs text-text-muted font-mono">
                            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-cyan">
                          {balanceLoading ? '...' : `${balance.toFixed(4)} SOL`}
                        </div>
                        <div className="text-xs text-text-muted">Available</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <Input
                  label="Recipient Address"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  error={recipientError || undefined}
                />

                {/* Amount */}
                <AmountInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  balance={`${balance.toFixed(4)} SOL`}
                  onMaxClick={() => setAmount((balance - 0.001).toFixed(4))}
                />

                {/* Standard Info */}
                <div className="p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                  <div className="flex items-start gap-2">
                    <TransferIcon className="w-4 h-4 text-neon-cyan mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-neon-cyan mb-1">Standard Transfer</p>
                      <p className="text-xs text-text-secondary">
                        Fast and cheap transfer. Transaction details are public on the blockchain.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Estimate */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Network Fee</span>
                  <span className="text-text-secondary">~0.000005 SOL</span>
                </div>

                {/* Error Display */}
                {transferError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="text-xs text-error">{transferError}</p>
                  </div>
                )}

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleSend}
                  disabled={!amount || !recipient || !!recipientError || transferLoading || parseFloat(amount) > balance}
                  loading={transferLoading}
                >
                  {transferLoading ? 'Sending...' : 'Send SOL'}
                </Button>
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
        onClose={handleSuccessClose}
        title="Transfer Complete!"
        message={`Successfully sent ${amount} SOL ${activeTab === 'private' ? 'privately' : ''}`}
        txSignature={transferResult?.signature || ''}
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

const TransferIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
