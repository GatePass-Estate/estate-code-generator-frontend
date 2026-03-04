export const Pagination = ({ currentPage, totalPages, onPageChange, condition }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; condition: boolean }) => {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center gap-2">
			<button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || condition} className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{Array.from({ length: totalPages }, (_, i) => i + 1).map((page, index) => (
				<button
					key={page + index}
					onClick={() => onPageChange(page)}
					disabled={condition}
					className={`flex items-center justify-center w-10 h-10 rounded-lg border ${page === currentPage ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
				>
					{page}
				</button>
			))}

			<button
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages || condition}
				className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9 6L15 12L9 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
		</div>
	);
};

export const PagePagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (n: number) => void }) => {
	return (
		<div className="flex items-center gap-2">
			<button type="button" className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			<div className="px-3 text-sm text-gray-600">
				Page {currentPage} of {totalPages}
			</div>

			<button type="button" className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9 6L15 12L9 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
		</div>
	);
};
