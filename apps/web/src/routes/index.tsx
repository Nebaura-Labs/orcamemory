import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="relative h-svh w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <img
          src="/images/hero.png"
          alt="Molt City opening ceremony with Mayor Mote"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950/80" />
      </div>
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-end px-6 pb-8 text-center md:justify-center md:pb-0">
        <Card className="w-full max-w-3xl rounded-3xl border border-white/12 bg-white/4 shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-[3px]">
          <CardContent className="p-8 md:p-12">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-white/90">
              Coming Soon
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] md:text-6xl">
              Molt City is opening its doors.
            </h1>
            <p className="mt-4 text-base text-white/85 md:text-lg">
              Mayor Mote is ready at Town Hall. The ribbon is set, the city is
              alive, and the first wave of Lobsters is almost here.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="absolute left-6 top-6 z-10 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur">
        molt.city
      </div>

    </div>
  );
}
