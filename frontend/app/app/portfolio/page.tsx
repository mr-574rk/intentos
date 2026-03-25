"use client";

import { useWalletGuard } from "@/hooks/useWalletGuard";
import PortfolioDashboard from "@/components/PortfolioDashboard";

export default function PortfolioPage() {
  const { isConnected } = useWalletGuard();
  if (!isConnected) return null;
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">Portfolio</h1>
        <p className="text-text-secondary text-sm">Your assets, active strategies, and 7-day performance.</p>
      </div>
      <PortfolioDashboard />
    </div>
  );
}
