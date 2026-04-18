import { Card, CardContent } from '@/components/ui/card';

export default function EventsLoading() {
	return (
		<div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-3">
					<div className="h-8 w-48 rounded bg-muted" />
					<div className="h-4 w-72 rounded bg-muted" />
				</div>
				<div className="h-10 w-36 rounded bg-muted" />
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="space-y-4 p-5">
							<div className="h-6 w-4/5 rounded bg-muted" />
							<div className="h-4 w-2/3 rounded bg-muted" />
							<div className="h-24 w-full rounded bg-muted" />
							<div className="flex gap-2">
								<div className="h-8 w-20 rounded bg-muted" />
								<div className="h-8 w-20 rounded bg-muted" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
