import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function UnauthorizedLoading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4 animate-pulse" aria-busy="true" aria-live="polite">
			<div className="w-full max-w-md">
				<Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
					<CardHeader className="text-center space-y-3">
						<div className="mx-auto h-16 w-16 rounded-full bg-muted" />
						<div className="h-8 w-40 mx-auto rounded bg-muted" />
						<div className="h-4 w-64 mx-auto rounded bg-muted" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="h-4 w-full rounded bg-muted" />
						<div className="h-4 w-5/6 mx-auto rounded bg-muted" />
						<div className="h-10 w-full rounded bg-muted" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
