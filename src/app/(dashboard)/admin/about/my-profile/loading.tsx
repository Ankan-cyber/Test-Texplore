import { Card, CardContent } from '@/components/ui/card';

export default function MyAboutProfileLoading() {
	return (
		<div className="space-y-6 p-4 sm:p-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="space-y-2">
				<div className="h-8 w-56 rounded bg-muted" />
				<div className="h-4 w-80 rounded bg-muted" />
			</div>

			<Card>
				<CardContent className="space-y-5 p-4 sm:p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="h-24 w-24 rounded-full bg-muted" />
						<div className="space-y-2">
							<div className="h-4 w-40 rounded bg-muted" />
							<div className="h-4 w-28 rounded bg-muted" />
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-10 rounded bg-muted" />
						))}
					</div>
					<div className="h-28 w-full rounded bg-muted" />
					<div className="h-10 w-36 rounded bg-muted" />
				</CardContent>
			</Card>
		</div>
	);
}
