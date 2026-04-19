"use client";

import { useEffect, useState } from "react";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { API_URL } from "@/lib/config";
import { Trophy, Copy, Users, Check, ExternalLink } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  intentText: string;
  returnPct: number;
  riskLevel: string;
  executedAt: string;
  txHash?: string;
  mock: boolean;
}

interface ReferralStats {
  address: string;
  inviteCount: number;
  referralLink: string;
  tier: {
    level: number;
    label: string;
    discount: number;
    perks: string[];
    nextThreshold: number | null;
  };
}

export default function ExplorePage() {
  const { isConnected, address } = useWalletGuard();
  const { t } = useLocale();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;

    let canceled = false;
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/leaderboard?limit=20`),
      fetch(`${API_URL}/api/referrals/${encodeURIComponent(address)}`),
    ])
      .then(async ([ldRes, refRes]) => {
        if (canceled) return;
        const ldData = await ldRes.json();
        const refData = await refRes.json();
        setLeaderboard(ldData.data ?? []);
        setStats(refData.data ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isConnected, address]);

  if (!isConnected || !address) return null;

  const handleCopy = async () => {
    if (!stats?.referralLink) return;
    const fullLink = `${window.location.origin}${stats.referralLink}`;
    await navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-2 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#00F5D4]" />
          {t("explore")}
        </h1>
        <p className="text-text-secondary text-sm">{t("explore_desc")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard (Left Side, flex=2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t("top_performers")}</h2>
            <span className="text-xs text-[#00F5D4] bg-[#00F5D4]/10 border border-[#00F5D4]/20 px-2 py-1 rounded-full">
              {t("this_week")}
            </span>
          </div>

          <div
            className="rounded-2xl border border-white/5 overflow-hidden"
            style={{ background: "#13161D" }}
          >
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400 animate-pulse">
                {t("loading")}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {t("no_leaderboard")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 border-b border-white/5 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-16">{t("rank")}</th>
                      <th className="px-4 py-3 font-semibold">{t("performer")}</th>
                      <th className="px-4 py-3 font-semibold">{t("goal")}</th>
                      <th className="px-4 py-3 font-semibold text-right">{t("return_pct")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.address + entry.rank}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4">
                          {entry.rank === 1 ? (
                            <span className="text-[#00F5D4] font-black text-lg">#1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-gray-300 font-bold text-base">#2</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-amber-600 font-bold text-base">#3</span>
                          ) : (
                            <span className="text-gray-500 font-medium">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium flex items-center gap-2">
                              {entry.displayName}
                              {entry.mock && (
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 rounded-sm">
                                  Demo
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {entry.address.slice(0, 10)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="bg-white/5 border border-white/10 px-2 py-1 rounded-md text-xs text-gray-300 inline-block max-w-[200px] truncate"
                            title={entry.intentText}
                          >
                            {entry.intentText}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-[#00F5D4] font-black tracking-wide">
                            +{entry.returnPct.toFixed(1)}%
                          </span>
                          <div className="flex justify-end mt-1">
                            {entry.riskLevel.toLowerCase() === "low" && (
                              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                                Low Risk
                              </span>
                            )}
                            {entry.riskLevel.toLowerCase() === "medium" && (
                              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">
                                Mid Risk
                              </span>
                            )}
                            {entry.riskLevel.toLowerCase() === "high" && (
                              <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                                High Risk
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Referrals & Stats (Right Side) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">{t("referrals")}</h2>

          {/* Referral Link Card */}
          <div
            className="rounded-2xl p-5 border shadow-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #13161D 0%, #1A1D24 100%)",
              borderColor: "rgba(0,245,212,0.15)",
            }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Users className="w-24 h-24 text-[#00F5D4]" />
            </div>

            <p className="text-sm font-semibold text-white mb-2">{t("invite_desc")}</p>

            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                {t("your_referral_link")}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 truncate">
                  {stats?.referralLink
                    ? `${typeof window !== "undefined" ? window.location.host : ""}${
                        stats.referralLink
                      }`
                    : "..."}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!stats}
                  className="bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border border-[#00F5D4]/30 text-[#00F5D4] p-2 rounded-lg transition-colors flex shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-white/5 bg-[#13161D] p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              {t("your_tier")}
            </h3>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-black text-white">
                {stats?.tier?.label ?? t("tier_none_label")}
              </span>
              <span className="text-sm font-semibold text-[#00F5D4] mb-1">
                {stats?.tier?.discount ? `${stats.tier.discount}% discount` : ""}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">{t("invite_count")}</span>
                <span className="text-sm font-bold text-white">{stats?.inviteCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">{t("next_tier_at")}</span>
                <span className="text-sm font-bold text-white">
                  {stats?.tier?.nextThreshold ?? "—"}
                </span>
              </div>

              {stats?.tier && stats?.tier?.perks.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                    {t("tier_perks")}
                  </span>
                  <ul className="space-y-2">
                    {stats.tier.perks.map((perk, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-3.5 h-3.5 text-[#00F5D4]" /> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
