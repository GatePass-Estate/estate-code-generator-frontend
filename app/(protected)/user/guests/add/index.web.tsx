import { ChangeEvent, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../_layout';
import { useRouter } from 'expo-router';

const GENDERS = ['Female', 'Male', "I'd prefer not to say"];
const RELATIONSHIPS = ['Spouse', 'Friends', 'Family', 'Delivery', 'Taxi', 'Service Provider'];

export default function AddGuestScreen() {
	const router = useRouter();

	const [name, setName] = useState<string>('');
	const [selectedGender, setSelectedGender] = useState<string>('Male');
	const [selectedRelationships, setSelectedRelationships] = useState<string>('Friends');
	const [otherRelationship, setOtherRelationship] = useState<string>('');
	const [saveToList, setSaveToList] = useState<boolean>(false);

	function handleSaveGuest() {
		if (!name.trim()) {
			Alert.alert('Validation', "Please enter the guest's name.");
			return;
		}
		if (!selectedGender) {
			Alert.alert('Validation', 'Please select a gender.');
			return;
		}
		if (!otherRelationship.trim()) {
			Alert.alert('Validation', 'Please select or enter a relationship.');
			return;
		}
		const payload = {
			name: name.trim(),
			gender: selectedGender,
			relationships: selectedRelationships,
			saveToList,
		};

		console.log('Save guest:', payload);
		Alert.alert('Success', 'Guest saved (see console).');
	}

	function handleGenerateCode() {
		router.push('/invite');
	}

	useEffect(() => {
		if (Platform.OS === 'web') {
			document.title = 'Generate Code - GatePass';
		}
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center gap-7 mt-10" />

				<div className="">
					<h1 className="text-4xl">Generate Code</h1>
					<p className="text-base text-tertiary mt-3">Fill in your guest details, it will take only a couple of minutes</p>
				</div>

				<div className="border border-[#d8e3e0] rounded-lg px-8 py-6 mt-10 bg-white flex flex-col gap-6 min-w-3xl">
					<div className="input-group-web">
						<label htmlFor="name" className="input-label-web">
							Name
						</label>
						<input name="name" placeholder="Enter guest name" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} className="input-style-web" />
					</div>

					<div className="input-group-web">
						<label htmlFor="gender" className="input-label-web">
							Select Gender
						</label>
						<div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
							{GENDERS.map((g) => {
								const active = selectedGender === g;
								return (
									<div key={g} className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[##cfe7db]'} gap-3 cursor-pointer`} onClick={() => setSelectedGender(g)}>
										<p>{g}</p>
										{active && <MaterialIcons name="check-circle" size={18} color="#2f855a" />}
									</div>
								);
							})}
						</div>
					</div>

					<div className="input-group-web">
						<label htmlFor="relationship-with-guest" className="input-label-web">
							Select your relationship with guest
						</label>
						<div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
							{RELATIONSHIPS.map((r) => {
								const active = selectedRelationships === r;
								return (
									<div key={r} className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[##cfe7db]'} gap-3 cursor-pointer`} onClick={() => setSelectedRelationships(r)}>
										<p>{r}</p>
										{active && <MaterialIcons name="check-circle" size={18} color="#2f855a" />}
									</div>
								);
							})}
						</div>
					</div>

					<div className="input-group-web">
						<label htmlFor="other" className="input-label-web">
							Other:
						</label>

						<input name="other" placeholder="Specify other relationship" value={otherRelationship} onChange={(e) => setOtherRelationship(e.target.value)} className="input-style-web" />
					</div>
				</div>

				<div className="mt-4 flex items-center gap-2">
					<input
						type="checkbox"
						name="saveDetails"
						id="saveDetails"
						className="mt-1 p-2 h-4 w-4"
						onChange={(e: ChangeEvent<HTMLInputElement>) => {
							const { checked } = e.target;
							setSaveToList(checked);
						}}
					/>
					<label htmlFor="saveDetails">
						<span className=" text-dark-teal text-sm">Save details to my guest list</span>
					</label>
				</div>

				<div className="mt-7 flex flex-row justify-end gap-3">
					<button className="bg-dark-teal rounded-md px-10 py-3">
						<p className="text-white text-sm font-semibold">Save Guest</p>
					</button>

					<button className="bg-primary rounded-md px-10 py-3" onClick={handleGenerateCode}>
						<p className="text-white text-sm font-semibold">Generate Code</p>
					</button>
				</div>
			</div>
		</div>
	);
}
