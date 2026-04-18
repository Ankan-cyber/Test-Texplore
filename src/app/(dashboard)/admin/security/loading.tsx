import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SecurityLoading() {
	return (
		<div className="space-y-6 p-4 sm:p-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="space-y-2">
				<div className="h-8 w-56 rounded bg-muted" />
				<div className="h-4 w-80 rounded bg-muted" />
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="space-y-2 p-4">
							<div className="h-3 w-24 rounded bg-muted" />
							<div className="h-7 w-16 rounded bg-muted" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader className="space-y-3">
					<div className="h-5 w-40 rounded bg-muted" />
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<div className="h-9 rounded bg-muted" />
						<div className="h-9 rounded bg-muted" />
						<div className="h-9 rounded bg-muted" />
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 10 }).map((_, i) => (
						<div key={i} className="h-10 rounded bg-muted" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
