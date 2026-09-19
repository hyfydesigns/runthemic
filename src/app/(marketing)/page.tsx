import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic2, QrCode, ListMusic, Users } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Instant shareable flyer",
    description: "Pick a theme, and RunTheMic generates a stunning flyer with a QR code the moment your event is created.",
  },
  {
    icon: Users,
    title: "One-link RSVPs",
    description: "Guests RSVP and start requesting songs from a single link — no account required.",
  },
  {
    icon: ListMusic,
    title: "Real YouTube playlist",
    description: "Guests search and add karaoke tracks straight to your event's YouTube playlist, live.",
  },
  {
    icon: Mic2,
    title: "Run the night from your phone",
    description: "Live host mode shows now playing, next up, and the request feed — full screen, mobile-first.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 pt-10">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-tight text-gradient-neon">RunTheMic</span>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </header>
      </div>

      <section className="relative isolate flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 py-24 text-center sm:py-32">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-karaoke.jpg)" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/85 to-background" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_hsl(291_90%_25%/0.35),_transparent_70%)]" />

        <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
          Turn any gathering into a
          <br />
          <span className="text-gradient-neon">professional karaoke night</span>
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
          Create the event, generate a stunning flyer, share one link, let friends RSVP and build the
          playlist together, then run the whole night from your phone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Host your first night — free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6">
        <section className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RunTheMic
        </footer>
      </div>
    </main>
  );
}
