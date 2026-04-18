import { Card, CardContent } from '@/components/ui/card';

export default function AdminAboutLoading() {
	return (
		<div className="space-y-6 p-4 sm:p-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<div className="h-8 w-56 rounded bg-muted" />
					<div className="h-4 w-72 rounded bg-muted" />
				</div>
				<div className="h-10 w-36 rounded bg-muted" />
			</div>

			<Card className="border-primary/20 bg-primary/5">
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-2">
						<div className="h-4 w-52 rounded bg-muted" />
						<div className="h-4 w-72 rounded bg-muted" />
					</div>
					<div className="h-10 w-32 rounded bg-muted" />
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-3 p-0">
					<div className="h-12 w-full rounded-t-md bg-muted" />
					<div className="space-y-3 p-4">
						{Array.from({ length: 7 }).map((_, i) => (
							<div key={i} className="h-10 rounded bg-muted" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
