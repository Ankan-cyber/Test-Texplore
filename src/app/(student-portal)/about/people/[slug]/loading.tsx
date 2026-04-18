import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Loading skeleton shown by the App Router during navigation to
 * /about/people/[slug]. Matches the final layout so the transition
 * feels instant and doesn't "stick" on the previous page.
 */
export default function AboutMemberLoading() {
  return (
    <div
      className="min-h-screen bg-background animate-pulse"
      data-testid="member-profile-loading"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-10 rounded bg-muted" />
            <span className="text-muted-foreground/40">/</span>
            <div className="h-3 w-14 rounded bg-muted" />
            <span className="text-muted-foreground/40">/</span>
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground/70 mb-6">
            <ArrowLeft className="h-4 w-4" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>

          <div className="grid md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-start">
            {/* Portrait placeholder */}
            <div className="w-40 h-40 md:w-64 md:h-64 rounded-2xl bg-muted border-4 border-primary/10 shadow-xl" />

            {/* Identity placeholders */}
            <div className="space-y-4">
              <div className="h-5 w-24 rounded-full bg-muted" />
              <div className="h-10 md:h-14 w-3/4 md:w-2/3 rounded-lg bg-muted" />
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="flex gap-3 pt-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="w-10 h-10 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio + sidebar */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-10">
            <div className="space-y-4">
              <div className="h-7 w-56 rounded bg-muted" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-11/12 rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
              <div className="pt-6 space-y-3">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-20 rounded-full bg-muted" />
                  <div className="h-6 w-24 rounded-full bg-muted" />
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="h-6 w-28 rounded-full bg-muted" />
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <div className="h-3 w-10 rounded bg-muted" />
                      <div className="h-4 w-32 rounded bg-muted" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-10 rounded bg-muted" />
                      <div className="h-4 w-40 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-4 w-11/12 rounded bg-muted" />
                  <div className="h-4 w-32 rounded bg-muted" />
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {/* Others grid */}
      <section className="py-10 md:py-16 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="h-7 w-64 rounded bg-muted mb-6" />
          <div className="grid gap-4 md:gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted mb-3" />
                  <div className="h-4 w-24 rounded bg-muted mb-2" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
