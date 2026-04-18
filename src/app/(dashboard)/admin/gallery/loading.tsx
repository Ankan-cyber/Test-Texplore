export default function GalleryLoading() {
	return (
		<div className="h-full flex flex-col animate-pulse" aria-busy="true" aria-live="polite">
			<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 space-y-3">
				<div className="h-8 w-64 rounded bg-muted" />
				<div className="h-4 w-96 max-w-full rounded bg-muted" />
			</div>

			<div className="flex-1 p-4 sm:p-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] overflow-hidden">
				<div className="rounded-lg border bg-card p-4 space-y-3">
					<div className="h-9 w-full rounded bg-muted" />
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-8 rounded bg-muted" />
					))}
				</div>

				<div className="rounded-lg border bg-card p-4 space-y-4 overflow-hidden">
					<div className="flex gap-3">
						<div className="h-9 w-48 rounded bg-muted" />
						<div className="h-9 w-32 rounded bg-muted" />
					</div>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 12 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<div className="aspect-square rounded bg-muted" />
								<div className="h-3 w-4/5 rounded bg-muted" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
