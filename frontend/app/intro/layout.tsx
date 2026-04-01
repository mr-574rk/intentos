// Standalone layout — no Providers, no Sidebar, no nav.
// This keeps /intro as a clean "black canvas" for screen recording.
export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
