import StrategyHistory from "@/components/StrategyHistory";

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">Strategy History</h1>
        <p className="text-text-secondary text-sm">All past strategies with execution results and performance.</p>
      </div>
      <StrategyHistory />
    </div>
  );
}
