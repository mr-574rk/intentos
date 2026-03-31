"use client";

import { useState } from "react";

interface UserAvatarProps {
  username?: string | null;
  address?: string | null;
  size?: number; // px, defaults to 40
}

/**
 * Derives a 6-char fallback string from the wallet address:
 * first 2 chars + middle 2 chars + last 2 chars.
 * e.g. "init18vj8p5eypd" → "inj8pd"
 */
function addressHash(addr: string): string {
  if (!addr || addr.length < 4) return addr;
  const mid = Math.floor(addr.length / 2);
  return addr.slice(0, 2) + addr.slice(mid - 1, mid + 1) + addr.slice(-2);
}

export default function UserAvatar({ username, address, size = 40 }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // Build image URL from username (strip ".init" suffix)
  const strippedUsername = username?.replace(/\.init$/, "");
  const imageUrl = strippedUsername
    ? `https://usernames-api.testnet.initia.xyz/image/${strippedUsername}`
    : null;

  const showImage = !!imageUrl && !imageFailed;
  const fallback  = addressHash(address ?? "");

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 border border-white/10"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={username ?? address ?? "avatar"}
          className="object-cover w-full h-full"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="w-full h-full bg-[#13161D] flex items-center justify-center">
          <span
            className="font-mono uppercase tracking-widest text-[#00F5D4] select-none"
            style={{
              fontSize: Math.max(7, Math.floor(size * 0.225)),
              textShadow: "0 0 5px rgba(0,245,212,0.5)",
            }}
          >
            {fallback}
          </span>
        </div>
      )}
    </div>
  );
}
