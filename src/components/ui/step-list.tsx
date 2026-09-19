export function StepList({ steps }: { steps: React.ReactNode[] }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <p className="text-muted-foreground">{step}</p>
        </div>
      ))}
    </div>
  );
}
