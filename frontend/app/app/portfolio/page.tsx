"use client";

import { useWalletGuard } from "@/hooks/useWalletGuard";
import PortfolioDashboard from "@/components/PortfolioDashboard";

export default function PortfolioPage() {
  const { isConnected } = useWalletGuard();
  if (!isConnected) return null;
  return (
    <div className="w-full">
      <PortfolioDashboard />
    </div>
  );
}
