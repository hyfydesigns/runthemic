import Link from "next/link";

export const metadata = {
  title: "Terms of Service — RunTheMic",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-gradient-neon">
          RunTheMic
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </header>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-2 text-xs">Last updated: September 19, 2026</p>
        </div>

        <p>
          These terms govern your use of RunTheMic. By creating an account, RSVPing to an event, or otherwise
          using RunTheMic, you agree to them.
        </p>

        <Section title="The service">
          <p>
            RunTheMic lets organizers create karaoke events, share a flyer and RSVP link, and run a
            collaborative YouTube-backed song queue. Guests can RSVP and request songs without creating an
            account.
          </p>
        </Section>

        <Section title="Accounts">
          <p>
            You&apos;re responsible for keeping your login credentials secure and for activity that happens
            under your account. You must provide accurate information when registering, and you must be old
            enough to form a binding contract in your jurisdiction to create an organizer account.
          </p>
        </Section>

        <Section title="YouTube API Services">
          <p>
            RunTheMic uses YouTube API Services. Connecting a YouTube account is optional and separate from
            logging in. If you connect a YouTube account, you authorize RunTheMic to create and manage a
            playlist on that account on your behalf, and you agree to the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              YouTube Terms of Service
            </a>
            . You&apos;re responsible for the content added to your playlist, including making sure you have
            the right to add it. You can revoke RunTheMic&apos;s access at any time from Settings or from{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              your Google account&apos;s security settings
            </a>
            .
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to use RunTheMic to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Violate any law, or the rights of any other person.</li>
            <li>Upload, request, or share content you don&apos;t have the right to use.</li>
            <li>Attempt to disrupt, spam, or abuse the service, other users, or connected third-party services (including YouTube).</li>
            <li>Impersonate another person or misrepresent your affiliation with any person or entity.</li>
          </ul>
        </Section>

        <Section title="Content">
          <p>
            You retain ownership of the event details, RSVP notes, and other content you submit. By submitting
            it, you give RunTheMic the license needed to store, display, and process it in order to provide
            the service — for example, showing your event page to guests, or syncing a song request to your
            connected YouTube playlist.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You can delete an event, disconnect YouTube, or stop using RunTheMic at any time. We may suspend
            or terminate access to accounts that violate these terms.
          </p>
        </Section>

        <Section title="Disclaimers">
          <p>
            RunTheMic is provided &quot;as is,&quot; without warranties of any kind. We don&apos;t guarantee
            the service will be uninterrupted or error-free, and we&apos;re not responsible for the
            availability or behavior of third-party services (like YouTube) that RunTheMic connects to.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>If we make material changes, we&apos;ll update the date at the top of this page.</p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about these terms?{" "}
            <a href="mailto:support@runthemic.com" className="text-primary underline underline-offset-2">
              support@runthemic.com
            </a>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
