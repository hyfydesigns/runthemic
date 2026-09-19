import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-10">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight text-gradient-neon">
        RunTheMic
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
