import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactLoading() {
	return (
		<div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="space-y-3">
				<div className="h-8 w-64 rounded bg-muted" />
				<div className="h-4 w-80 rounded bg-muted" />
			</div>

			<Card>
				<CardHeader className="space-y-3">
					<CardTitle className="h-5 w-40 rounded bg-muted" />
					<div className="h-10 w-full rounded bg-muted" />
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 7 }).map((_, i) => (
						<div key={i} className="grid grid-cols-12 gap-3">
							<div className="col-span-3 h-8 rounded bg-muted" />
							<div className="col-span-4 h-8 rounded bg-muted" />
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
