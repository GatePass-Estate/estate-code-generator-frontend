import { GuestsProps } from '.';

const MyGuest = ({ searchQuery, guests, loading, deleting, fetchGuests, deleteGuest, setSearchQuery, setLoading, setDeleting, filteredGuests }: GuestsProps) => {
	return (
		<div className="p-4">
			<div className="mb-4">
				<input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search guests..." className="w-full p-2 border rounded" />
			</div>
			{loading ? (
				<div>Loading...</div>
			) : (
				<div className="grid gap-4">
					{filteredGuests.map((guest) => (
						<div key={guest.id} className="border p-4 rounded flex justify-between items-center">
							<div>
								<h3 className="font-bold">{guest.guest_name}</h3>
								<p className="text-gray-600">{guest.relationship}</p>
							</div>
							<button onClick={() => deleteGuest(guest.id)} disabled={deleting} className="text-red-500 px-4 py-2 rounded">
								Delete
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default MyGuest;
