import AccessCodeCard from '@/src/components/web/AccessCodeCard';
import WebSidebar from '@/src/components/web/WebSidebar';
import icons from '@/src/constants/icons';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { menuRoutes } from './_layout';

export default function HomeWeb() {
	const router = useRouter();

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body ">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center gap-7 mt-10">
					<h1 className="text-4xl">Active Codes</h1>

					<div className="flex justify-between flex-wrap gap-5">
						<AccessCodeCard
							code="7653E2"
							details={{
								name: 'Sandra',
								address: '123 Main St, City, Country.',
								date: '2023-10-01',
								timeframe: '2 hours',
							}}
							variant="warning"
						/>
						<AccessCodeCard
							code="7653E2"
							details={{
								name: 'Sandra',
								address: '123 Main St, City, Country.',
								date: '2023-10-01',
								timeframe: '2 hours',
							}}
							variant="success"
						/>
						<AccessCodeCard
							code="7653E2"
							details={{
								name: 'Sandra',
								address: '123 Main St, City, Country.',
								date: '2023-10-01',
								timeframe: '2 hours',
							}}
							variant="default"
						/>
					</div>

					<div className="flex flex-col items-center gap-4 mt-6 self-end">
						<div className="flex items-center gap-2">
							<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed" disabled>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>

							<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M9 6L15 12L9 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div className="flex flex-col justify-center gap-4">
					<h1 className="text-2xl font-semibold">My Guest List</h1>

					<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
						{Array(5)
							.fill(0)
							.map((_, i) => (
								<div className="flex gap-4 items-center p-3 bg-light-grey w-full rounded-lg">
									<Image source={icons.femaleIcon} style={{ width: 30, height: 30 }} />

									<div className="flex flex-col">
										<p className="text-xl capitalize">{'sandra'}</p>
										<span className="text-sm capitalize">friend</span>
									</div>

									<div className="flex gap-3 ml-auto">
										<button type="button" className="capitalize px-8 py-3 bg-teal font-semibold rounded-lg text-white">
											delete
										</button>
										<button type="button" className="capitalize px-8 py-3 bg-primary font-semibold rounded-lg text-white">
											generate code
										</button>
									</div>
								</div>
							))}
					</div>

					{/* Pagination */}
					<div className="flex flex-col items-center gap-4 mt-2 self-end">
						<div className="flex items-center gap-2">
							<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed" disabled>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>

							<div className="flex items-center gap-2">
								<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-primary bg-primary text-white">1</button>
								<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">2</button>
								<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">3</button>
							</div>

							<button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M9 6L15 12L9 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>
						</div>
					</div>
					<br />
				</div>
			</div>
		</div>
	);
}
