import { NextResponse } from "next/server";

/**
 * Ticket checkout is scaffolded but not wired up in the MVP — the Event
 * schema already carries ticketPriceCents/donationLinkUrl for when Stripe
 * keys are configured and this route is built out.
 */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Ticket checkout isn't configured yet. Contact the organizer for payment details." },
      { status: 501 },
    );
  }

  return NextResponse.json({ error: "Stripe checkout is not implemented yet" }, { status: 501 });
}
