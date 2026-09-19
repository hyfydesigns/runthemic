import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const DEMO_TIMEZONE = "America/Chicago";

const DEMO_VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "Never Gonna Give You Up - Karaoke", channel: "Sing King", duration: 213 },
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody - Karaoke Instrumental", channel: "KaraFun", duration: 355 },
  { id: "y6120QOlsfU", title: "Sandstorm - Karaoke Version", channel: "Karaoke Tunes", duration: 154 },
  { id: "2Vv-BfVoq4g", title: "Perfect - Karaoke Instrumental", channel: "Sing King", duration: 263 },
  { id: "09R8_2nJtjg", title: "Sugar - Karaoke Version", channel: "KaraFun", duration: 235 },
  { id: "JGwWNGJdvx8", title: "Shape of You - Karaoke", channel: "Sing King", duration: 233 },
  { id: "CevxZvSJLk8", title: "Roar - Karaoke Instrumental", channel: "Karaoke Tunes", duration: 223 },
  { id: "kJQP7kiw5Fk", title: "Despacito - Karaoke Version", channel: "KaraFun", duration: 229 },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const organizer = await prisma.user.upsert({
    where: { email: "demo@runthemic.test" },
    update: {},
    create: {
      email: "demo@runthemic.test",
      name: "Demo Organizer",
      passwordHash,
    },
  });

  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const y = sevenDaysOut.getFullYear();
  const m = String(sevenDaysOut.getMonth() + 1).padStart(2, "0");
  const d = String(sevenDaysOut.getDate()).padStart(2, "0");
  // 8:00 PM in the venue's own timezone, not whatever timezone this script happens to run in.
  const startsAt = fromZonedTime(`${y}-${m}-${d}T20:00:00`, DEMO_TIMEZONE);

  const event = await prisma.event.upsert({
    where: { slug: "friday-night-karaoke-demo" },
    update: {},
    create: {
      organizerId: organizer.id,
      slug: "friday-night-karaoke-demo",
      name: "Friday Night Karaoke",
      description: "Weekly karaoke night at The Blue Note. All skill levels welcome — bring your best (or worst) vocals!",
      startsAt,
      timezone: DEMO_TIMEZONE,
      isVirtual: false,
      locationName: "The Blue Note Bar",
      locationAddress: "123 Main St, Springfield",
      capacity: 6,
      privacy: "LINK_ONLY",
      themeColor: "#ff2fb0",
      ticketPriceCents: 0,
      dressCode: "Casual, come as you are",
      ageRestriction: "21+",
      byobNotes: "BYOB welcome, snacks provided",
      status: "PUBLISHED",
      autoApproveRequests: false,
    },
  });

  await prisma.flyerConfig.upsert({
    where: { eventId: event.id },
    update: {},
    create: { eventId: event.id, templateKey: "NEON", fieldOverrides: {} },
  });

  const guestSeed = [
    { name: "Alex Rivera", status: "GOING" as const },
    { name: "Jordan Lee", status: "GOING" as const },
    { name: "Sam Patel", status: "GOING" as const },
    { name: "Taylor Kim", status: "GOING" as const },
    { name: "Morgan Diaz", status: "GOING" as const },
    { name: "Casey Nguyen", status: "GOING" as const }, // 6th GOING -> hits capacity
    { name: "Riley Chen", status: "GOING" as const }, // 7th -> waitlisted
    { name: "Drew Thompson", status: "MAYBE" as const },
    { name: "Jamie Foster", status: "CANT_GO" as const },
  ];

  const guestSessions = [];
  let goingCount = 0;
  for (const g of guestSeed) {
    let rsvpStatus: "GOING" | "MAYBE" | "CANT_GO" | "WAITLISTED" = g.status;
    let waitlisted = false;
    if (g.status === "GOING") {
      goingCount += 1;
      if (goingCount > event.capacity!) {
        rsvpStatus = "WAITLISTED";
        waitlisted = true;
      }
    }
    const guest = await prisma.guestSession.create({
      data: { eventId: event.id, displayName: g.name, rsvpStatus, waitlisted },
    });
    guestSessions.push(guest);
  }

  const statuses = ["PENDING", "PENDING", "APPROVED", "APPROVED", "APPROVED", "PLAYING", "PLAYED", "REJECTED"] as const;

  for (let i = 0; i < DEMO_VIDEOS.length; i++) {
    const video = DEMO_VIDEOS[i]!;
    const status = statuses[i] ?? "APPROVED";
    const guest = guestSessions[i % guestSessions.length]!;
    await prisma.queueItem.create({
      data: {
        eventId: event.id,
        guestSessionId: guest.id,
        youtubeVideoId: video.id,
        youtubeVideoTitle: video.title,
        youtubeChannelTitle: video.channel,
        thumbnailUrl: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
        durationSeconds: video.duration,
        requestedBy: guest.displayName,
        status,
        position: status === "APPROVED" || status === "PLAYING" ? (i + 1) * 1000 : 0,
        playedAt: status === "PLAYED" ? new Date() : null,
      },
    });
  }

  console.log("Seeded demo organizer: demo@runthemic.test / password123");
  console.log(`Seeded event: /e/${event.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
