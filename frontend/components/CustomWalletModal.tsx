"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useConnect, useConnectors } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ExternalLink, Loader2, Mail, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CHAIN_ID } from "@/lib/config";

// ── Wallet static metadata ────────────────────────────────────────────────────
// Connector IDs match wagmi connector IDs registered by InterwovenKit

const WALLET_METADATA: Record<string, {
  name: string;
  image: string;
  installUrl: string;
  cosmosProvider?: () => CosmosProvider | undefined;
}> = {
  "app.keplr": {
    name: "Keplr",
    image: "/Keplr.webp",
    installUrl: "https://keplr.app/get",
    cosmosProvider: () => typeof window !== "undefined" ? window.keplr : undefined,
  },
  "io.leapwallet": {
    name: "Leap",
    image: "/leap.svg",
    installUrl: "https://leapwallet.io/download",
    cosmosProvider: () => typeof window !== "undefined" ? window.leap : undefined,
  },
  "io.metamask": {
    name: "MetaMask",
    image: "/metamask.svg",
    installUrl: "https://metamask.io/download",
  },
  "app.phantom": {
    name: "Phantom",
    image: "/Phantom.webp",
    installUrl: "https://phantom.com",
  },
  "io.rabby": {
    name: "Rabby",
    image: "/Rabby.webp",
    installUrl: "https://rabby.io",
  },
};

// IDs shown in our primary list
const PRIMARY_IDS = ["app.keplr", "io.leapwallet", "io.metamask", "app.phantom", "io.rabby"];

// wagmi's own localStorage key — same one the kit reads for "Recent"
const WAGMI_RECENT_KEY = "wagmi.recentConnectorId";

// ── Social Icons ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomWalletModal({ isOpen, onClose }: CustomWalletModalProps) {
  const { openConnect } = useInterwovenKit();
  const connectors = useConnectors();
  const { connect, isPending, variables } = useConnect({
    mutation: { onSuccess: () => onClose() }
  });

  // Read wagmi's own recentConnectorId — exactly what the kit uses
  const [recentId, setRecentId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raw = localStorage.getItem(WAGMI_RECENT_KEY);
      try {
        setRecentId(raw ? JSON.parse(raw) : null);
      } catch {
        setRecentId(raw); // fallback if it's not JSON
      }
      setShowMore(false);
      setConnectError(null);
    }
  }, [isOpen]);

  // ID of the connector currently pending
  const pendingId = isPending && variables?.connector && "id" in (variables.connector as object)
    ? (variables.connector as { id: string }).id
    : null;

  // Build enriched wallet list
  const walletItems = PRIMARY_IDS.map(id => {
    const meta = WALLET_METADATA[id];
    const connector = connectors.find(c => c.id === id);
    const isInstalled = !!connector || !!(meta.cosmosProvider?.());
    const isRecent = recentId === id;
    const isConnecting = pendingId === id;
    return { id, meta, connector, isInstalled, isRecent, isConnecting };
  });

  // Keywords to exclude from "More Wallets" if they match primary wallet names
  const primaryKeywords = ["keplr", "leap", "metamask", "phantom", "rabby", "privy"];
  const PRIVY_ID = "cmbq1ozyc006al70lx4uciz0q";

  // "More Wallets" = connectors NOT already shown in primary list by ID or name keywords
  const moreWallets = connectors.filter(c => {
    const nameLower = c.name.toLowerCase();
    const isPrimary = PRIMARY_IDS.includes(c.id) || 
                     primaryKeywords.some(kw => nameLower.includes(kw));
    return !isPrimary && c.id !== PRIVY_ID;
  });

  const handleConnect = async (id: string) => {
    setConnectError(null);
    const item = walletItems.find(w => w.id === id);
    if (!item) return;

    // Not installed → open install page, don't attempt connect
    if (!item.isInstalled) {
      window.open(item.meta.installUrl, "_blank", "noopener noreferrer");
      return;
    }

    try {
      // Wagmi expects JSON strings in localStorage
      const jsonId = JSON.stringify(id);
      localStorage.setItem(WAGMI_RECENT_KEY, jsonId);
      setRecentId(id);

      if (item.connector) {
        // Primary path: call wagmi connect directly with the detected connector.
        // This triggers the wallet extension's OWN popup (Keplr, MetaMask, etc.)
        // without opening the InterwovenKit drawer at all.
        connect({ connector: item.connector });
      } else if (item.meta.cosmosProvider) {
        // Cosmos extension is on window but wagmi hasn't surfaced an EIP-6963 connector for it.
        // Directly enable the Cosmos provider — this triggers the wallet's own approval popup.
        const provider = item.meta.cosmosProvider();
        if (provider) {
          await provider.enable(CHAIN_ID);
          // After enabling, re-check if a connector appeared and connect via wagmi
          const freshConnectors = connectors;
          const matched = freshConnectors.find(c => c.id === id);
          if (matched) {
            connect({ connector: matched });
          } else {
            // Provider enabled — kit will pick up the new account on next render
            onClose();
          }
        }
      } else {
        setConnectError(`${item.meta.name} not detected. Try refreshing.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      setConnectError(message);
    }
  };

  const handleMoreWalletConnect = (connector: ReturnType<typeof useConnectors>[number]) => {
    const jsonId = JSON.stringify(connector.id);
    localStorage.setItem(WAGMI_RECENT_KEY, jsonId);
    setRecentId(connector.id);
    connect({ connector });
  };

  const handleSocial = () => {
    const privyConnector = connectors.find(c => c.id === PRIVY_ID || c.name.toLowerCase().includes("privy"));
    if (privyConnector) {
      localStorage.setItem(WAGMI_RECENT_KEY, JSON.stringify(privyConnector.id));
      connect({ connector: privyConnector });
    } else {
      // Absolute fallback if connector is missing from wagmi
      openConnect();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cwm-overlay"
            className="fixed inset-0 z-50 bg-[#0D0F14]/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Modal / Bottom Sheet Positioning Wrapper */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="cwm-card"
              className="w-full sm:max-w-md bg-[#0D0F14] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl shadow-[0_-10px_40px_rgba(0,245,212,0.05)] sm:shadow-[0_0_60px_rgba(0,245,212,0.07),0_32px_64px_rgba(0,0,0,0.7)] flex flex-col relative pointer-events-auto max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Mobile Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              {/* Ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-20 bg-[#00F5D4]/10 blur-[48px] rounded-full pointer-events-none" />

              {/* ── Fixed Header ── */}
              <div className="relative flex items-start justify-between px-6 pt-4 sm:pt-6 pb-3 bg-[#0D0F14] z-10">
                <div>
                  <h2 className="text-[18px] font-bold text-white tracking-tight mb-0.5">Connect to IntentOS</h2>
                  <p className="text-[13px] text-gray-500">The AI Operating System for DeFi</p>
                </div>
                <button
                  id="wallet-modal-close"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors mt-0.5 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto flex-1 pb-6 custom-scrollbar">
                {/* Trust Card */}
                <div className="px-4 pt-1">
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#00F5D4]/10 to-transparent border border-[#00F5D4]/20 rounded-2xl">
                    <ShieldCheck className="w-4 h-4 text-[#00F5D4] drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Security First</p>
                      <p className="text-xs text-gray-400 leading-relaxed mt-1">
                        IntentOS never controls your funds. All strategies are executed through your wallet and confirmed on-chain.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email / Socials */}
                <div className="px-4 mt-4">
                  <motion.button
                    id="wallet-connect-social"
                    onClick={handleSocial}
                    disabled={isPending}
                    className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all duration-300 group disabled:opacity-50"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <span className="text-sm font-medium text-white">Email / Socials</span>
                    <div className="flex items-center gap-3">
                      <GoogleIcon />
                      <Mail className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                      <span className="text-gray-500 group-hover:text-gray-300 transition-colors"><XIcon /></span>
                    </div>
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-5 px-4">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Or Connect Wallet</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                {/* Primary Wallet List */}
                <div className="flex flex-col gap-2 px-4">
                  {walletItems.map(({ id, meta, isInstalled, isRecent, isConnecting }) => (
                    <motion.button
                      key={id}
                      id={`wallet-connect-${id.replace(/\./g, "-")}`}
                      onClick={() => handleConnect(id)}
                      disabled={isPending}
                      className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-[#00F5D4]/30 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden disabled:opacity-60"
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00F5D4]/0 via-[#00F5D4]/[0.025] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      <div className="flex items-center gap-3 relative">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/5">
                          {isConnecting ? (
                            <Loader2 className="w-5 h-5 text-[#00F5D4] animate-spin" />
                          ) : (
                            <Image src={meta.image} alt={meta.name} width={36} height={36} className="object-contain" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-white font-medium leading-tight">{meta.name}</p>
                          <p className="text-[10px] mt-0.5 font-medium">
                            {isRecent
                              ? <span className="text-[#00F5D4]">Recent</span>
                              : isInstalled
                                ? <span className="text-emerald-400/80">Installed</span>
                                : <span className="text-gray-600">Not installed</span>
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {id === "app.keplr" && isInstalled && !isRecent && (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-[#00F5D4]/15 text-[#00F5D4] rounded-full border border-[#00F5D4]/20 tracking-wide">
                            Recommended
                          </span>
                        )}
                        {!isInstalled ? (
                          <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#00F5D4] transition-colors" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00F5D4]/20 transition-colors">
                            <svg className="w-3 h-3 text-gray-600 group-hover:text-[#00F5D4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Error */}
                {connectError && (
                  <p className="text-red-400 text-xs text-center px-4 mt-3">{connectError}</p>
                )}

                {/* More Wallets */}
                {moreWallets.length > 0 && (
                  <div className="px-4 mt-3">
                    <button
                      id="wallet-connect-more"
                      onClick={() => setShowMore(v => !v)}
                      className="w-full py-2.5 text-sm text-gray-500 hover:text-white bg-transparent hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`} />
                      {showMore ? "Show fewer wallets" : `More wallets (${moreWallets.length})`}
                    </button>

                    <AnimatePresence>
                      {showMore && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2 pt-2">
                            {moreWallets.map(connector => {
                              const isRecentMore = recentId === connector.id;
                              const isConnectingMore = pendingId === connector.id;
                              return (
                                <motion.button
                                  key={connector.id}
                                  onClick={() => handleMoreWalletConnect(connector)}
                                  disabled={isPending}
                                  className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-[#00F5D4]/30 hover:bg-white/[0.04] transition-all duration-300 group disabled:opacity-60"
                                  whileHover={{ scale: 1.005 }}
                                  whileTap={{ scale: 0.995 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/5">
                                      {isConnectingMore ? (
                                        <Loader2 className="w-5 h-5 text-[#00F5D4] animate-spin" />
                                      ) : connector.icon ? (
                                        <img src={connector.icon} alt={connector.name} className="w-9 h-9 object-contain rounded-xl" />
                                      ) : (
                                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                                          {connector.name.slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm text-white font-medium leading-tight">{connector.name}</p>
                                      <p className="text-[10px] mt-0.5 font-medium">
                                        {isRecentMore
                                          ? <span className="text-[#00F5D4]">Recent</span>
                                          : <span className="text-emerald-400/80">Installed</span>
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00F5D4]/20 transition-colors">
                                    <svg className="w-3 h-3 text-gray-600 group-hover:text-[#00F5D4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Footer (inside scrollable so it's not cut off on small phones) */}
                <div className="px-6 py-3 mt-4">
                  <p className="text-[10px] text-gray-500 text-center">
                    By connecting, you agree to IntentOS terms. Your keys, your crypto.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
