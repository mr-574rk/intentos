import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "IntentOS — AI-Powered DeFi on Initia",
  description:
    "Express your financial goals in plain English. IntentOS converts them into simulated and executable DeFi strategies on Initia.",
  keywords: ["DeFi", "AI", "Initia", "blockchain", "intent", "Web3"],
  openGraph: {
    title: "IntentOS",
    description: "AI-powered DeFi operating system on Initia",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1500,
        height: 500,
        alt: "IntentOS Banner",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-primary text-text-primary min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

