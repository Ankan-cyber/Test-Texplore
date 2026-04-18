import { Card, CardContent } from '@/components/ui/card';

export default function EventRegistrationsLoading() {
	return (
		<div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="h-10 w-36 rounded bg-muted" />
				<div className="space-y-2">
					<div className="h-8 w-56 rounded bg-muted" />
					<div className="h-4 w-72 rounded bg-muted" />
				</div>
			</div>

			<Card>
				<CardContent className="space-y-3 p-4 sm:p-6">
					<div className="h-10 w-full rounded bg-muted" />
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="grid grid-cols-12 gap-3">
							<div className="col-span-3 h-8 rounded bg-muted" />
							<div className="col-span-2 h-8 rounded bg-muted" />
							<div className="col-span-2 h-8 rounded bg-muted" />
							<div className="col-span-2 h-8 rounded bg-muted" />
							<div className="col-span-2 h-8 rounded bg-muted" />
							<div className="col-span-1 h-8 rounded bg-muted" />
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
