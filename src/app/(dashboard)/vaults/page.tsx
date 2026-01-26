"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

// Mock vaults data
const vaults = [
  {
    id: "vault-1",
    name: "Main Vault",
    address: "0x4f2e...8a3b",
    balance: 450.5,
    hidden: 380.2,
    isDefault: true,
    status: "active",
  },
  {
    id: "vault-2",
    name: "Trading Vault",
    address: "0x7c1d...2e5f",
    balance: 125.0,
    hidden: 125.0,
    isDefault: false,
    status: "active",
  },
  {
    id: "vault-3",
    name: "Savings",
    address: "0x9a3b...1c4d",
    balance: 200.0,
    hidden: 200.0,
    isDefault: false,
    status: "active",
  },
  {
    id: "vault-4",
    name: "Betting Vault",
    address: "0x2d5e...9f1a",
    balance: 50.0,
    hidden: 50.0,
    isDefault: false,
    status: "locked",
  },
];

export default function VaultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredVaults = vaults.filter(
    (vault) =>
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = vaults.reduce((acc, v) => acc + v.balance, 0);
  const totalHidden = vaults.reduce((acc, v) => acc + v.hidden, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Shadow Vaults</h1>
          <p className="text-sm text-text-secondary">Manage your private wallets</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          + Create Vault
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-2">Total Vaults</div>
          <div className="text-2xl font-bold text-text-primary">{vaults.length}</div>
          <div className="text-xs text-neon-green">All Active</div>
        </Card>
        <Card variant="glow" padding="md">
          <div className="text-xs text-text-muted mb-2">Total Hidden</div>
          <div className="text-2xl font-bold text-neon-green">{totalHidden.toFixed(1)} SOL</div>
          <div className="text-xs text-text-secondary">≈ ${(totalHidden * 150).toLocaleString()}</div>
        </Card>
        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-2">Total Balance</div>
          <div className="text-2xl font-bold text-text-primary">{totalBalance.toFixed(1)} SOL</div>
          <div className="text-xs text-text-secondary">≈ ${(totalBalance * 150).toLocaleString()}</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Search vaults..."
          />
        </div>
      </div>

      {/* Vaults Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVaults.map((vault) => (
          <Link key={vault.id} href={`/vaults/${vault.id}`}>
            <Card variant="vault" padding="md" className="h-full cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold">
                    {vault.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary">{vault.name}</h3>
                      {vault.isDefault && (
                        <Badge size="xs" variant="cyan">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted font-mono">{vault.address}</p>
                  </div>
                </div>
                <Badge
                  size="xs"
                  variant={vault.status === "active" ? "success" : "warning"}
                  dot
                >
                  {vault.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-bg-tertiary">
                  <div className="text-[10px] text-text-muted mb-0.5">Balance</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {vault.balance} SOL
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neon-green/5 border border-neon-green/20">
                  <div className="text-[10px] text-text-muted mb-0.5">Hidden</div>
                  <div className="text-sm font-semibold text-neon-green">
                    {vault.hidden} SOL
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {/* Create New Vault Card */}
        <Card
          variant="default"
          padding="md"
          hover={false}
          className="border-dashed flex items-center justify-center min-h-[180px] cursor-pointer hover:border-neon-green/40 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted">
              <PlusIcon />
            </div>
            <p className="text-sm font-medium text-text-secondary">Create New Vault</p>
            <p className="text-xs text-text-muted">Add another shadow wallet</p>
          </div>
        </Card>
      </div>

      {/* Create Vault Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Shadow Vault"
        description="Create a new private wallet for your funds"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Vault Name
            </label>
            <input
              type="text"
              placeholder="e.g., Trading Vault"
              className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button fullWidth>Create Vault</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
