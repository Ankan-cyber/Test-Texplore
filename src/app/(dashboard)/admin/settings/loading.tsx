import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SettingsLoading() {
	return (
		<div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="space-y-3">
				<div className="h-8 w-56 rounded bg-muted" />
				<div className="h-4 w-80 rounded bg-muted" />
			</div>

			<Card>
				<CardHeader className="space-y-2">
					<div className="h-6 w-48 rounded bg-muted" />
					<div className="h-4 w-64 rounded bg-muted" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4 py-6">
						<div className="mx-auto h-16 w-16 rounded-full bg-muted" />
						<div className="mx-auto h-6 w-48 rounded bg-muted" />
						<div className="mx-auto h-4 w-72 rounded bg-muted" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<div className="h-6 w-44 rounded bg-muted" />
					<div className="h-4 w-64 rounded bg-muted" />
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="h-10 w-full rounded bg-muted" />
					<div className="h-10 w-full rounded bg-muted" />
					<div className="h-10 w-36 rounded bg-muted" />
				</CardContent>
			</Card>
		</div>
	);
}
