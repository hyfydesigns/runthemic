import { EventForm } from "@/components/wizard/event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold">Create an event</h1>
      <EventForm mode="create" />
    </div>
  );
}
