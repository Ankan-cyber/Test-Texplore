import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugLoading() {
	return (
		<div className="p-6 animate-pulse" aria-busy="true" aria-live="polite">
			<Card>
				<CardHeader>
					<CardTitle className="h-6 w-44 rounded bg-muted" />
					<CardDescription className="h-4 w-60 rounded bg-muted" />
				</CardHeader>
				<CardContent className="space-y-6">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<div className="h-5 w-36 rounded bg-muted" />
							<div className="space-y-2">
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-4 w-2/3 rounded bg-muted" />
								<div className="h-4 w-1/2 rounded bg-muted" />
							</div>
						</div>
					))}
					<div className="flex gap-2">
						<div className="h-10 w-32 rounded bg-muted" />
						<div className="h-10 w-24 rounded bg-muted" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
