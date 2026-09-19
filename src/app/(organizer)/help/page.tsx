import { redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const sections: FaqSection[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "What's the basic flow for running a karaoke night?",
        a: (
          <ol className="list-decimal space-y-1 pl-4">
            <li>Create an event from the dashboard.</li>
            <li>Share the event link (or its QR code) with your guests.</li>
            <li>Guests RSVP and request songs — no account needed on their end.</li>
            <li>You approve requests as they come in, or turn on auto-approve.</li>
            <li>On the night, open Host mode to advance the queue, and TV display to project it.</li>
          </ol>
        ),
      },
      {
        q: "Do guests need to create an account?",
        a: "No. RSVPing creates a lightweight guest session tied to their browser (via a cookie) — no password or sign-up required.",
      },
    ],
  },
  {
    title: "The event link",
    items: [
      {
        q: "What does the event link do?",
        a: 'It opens your event\'s public page, where anyone with the link can see the details, RSVP, and (once RSVP\'d) request songs. The same link is encoded into the QR code on your flyer, and you can copy it or open it from the "Share your event" card on the event page.',
      },
      {
        q: "Can I control who sees it?",
        a: 'An event\'s privacy is set to Public, Private, or Link only when you create it. Right now there\'s no public discovery/search page, so the practical difference is the same either way: the link itself is what grants access — anyone you send it to (or who scans the QR code) can open the event.',
      },
      {
        q: "Does the link ever change?",
        a: "No — it's generated once when you create the event and stays the same, so it's safe to print on flyers or save to a calendar invite.",
      },
    ],
  },
  {
    title: "Flyer",
    items: [
      {
        q: "How do I customize the flyer?",
        a: "Open Flyer from the event page. Pick a template, optionally override the title/subtitle text, and generate an abstract background or upload your own photo — then export it as a PNG.",
      },
      {
        q: "Where does the QR code on the flyer point?",
        a: "The same public event link described above.",
      },
    ],
  },
  {
    title: "Song queue & YouTube",
    items: [
      {
        q: "Do I need to connect YouTube?",
        a: "It's optional. Without it, the song queue still works — requests are stored and playable from the app. Connect YouTube (from Settings) to also get a real, shareable YouTube playlist that stays in sync with the queue.",
      },
      {
        q: "What happens when a guest requests a song?",
        a: "It's added to the queue as Pending (or Approved automatically, if you've turned on auto-approve for the event). If YouTube is connected, it's also added to the event's YouTube playlist — creating that playlist automatically the first time.",
      },
      {
        q: "Can I remove or reject a request?",
        a: "Yes, from the Song queue page — reject a pending request, or remove one that's already approved.",
      },
    ],
  },
  {
    title: "Running the show",
    items: [
      {
        q: "What's the difference between Host mode and TV display?",
        a: "Host mode is your control panel — approve requests and advance to the next song. TV display is a read-only, unauthenticated view meant for a projector or TV, showing what's now playing and what's up next.",
      },
      {
        q: "Do updates show up live for everyone?",
        a: "Yes — the queue, RSVPs, and now-playing status all push out in real time to guests, hosts, and the TV display as changes happen.",
      },
    ],
  },
  {
    title: "Co-hosts",
    items: [
      {
        q: "Can someone else help run the event?",
        a: "Yes — invite a co-host from the event's Co-hosts page and assign them a role: full access, songs only, or RSVPs only.",
      },
      {
        q: "Who can delete an event?",
        a: "Only the organizer who created it — co-hosts can't delete an event, even with full access.",
      },
    ],
  },
];

export default async function HelpPage() {
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Help</h1>
        <p className="text-sm text-muted-foreground">Answers to common questions about running a night.</p>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-0">
            {section.items.map((item) => (
              <details key={item.q} className="group border-t border-border py-3 first:border-t-0 first:pt-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-muted-foreground">{item.a}</div>
              </details>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Still stuck?</CardTitle>
          <CardDescription>
            Reach out to whoever set up RunTheMic for your organization, or check Settings to confirm your
            YouTube connection if songs aren&apos;t syncing.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
