import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function JoinClubLoading() {
	return (
		<div className="container mx-auto p-4 sm:p-6 space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="space-y-2">
					<div className="h-8 w-64 rounded bg-muted" />
					<div className="h-4 w-96 max-w-full rounded bg-muted" />
				</div>
				<div className="h-7 w-32 rounded bg-muted" />
			</div>

			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="h-10 flex-1 rounded bg-muted" />
						<div className="h-10 w-full sm:w-[200px] rounded bg-muted" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="h-6 w-36 rounded bg-muted" />
				</CardHeader>
				<CardContent className="space-y-3">
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
