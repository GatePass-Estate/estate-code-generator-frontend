import { ChangeEvent, useEffect, useState } from 'react';
import { Image, Platform, useWindowDimensions } from 'react-native';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../_layout';
import { useRouter } from 'expo-router';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import { generateCode } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { createGuest } from '@/src/lib/api/guests';
import { GenderType, RelationshipType } from '@/src/types/general';
import { getWidthBreakpoint, timeCalc } from '@/src/lib/helpers';
import UserIcon from '@/src/components/mobile/UserIcon';

const GENDERS = [
	{ name: 'female', value: 'female' },
	{ name: 'male', value: 'male' },
	{ name: "I'd prefer not to say", value: 'prefer_not_to_say' },
];
const RELATIONSHIPS = [
	{ name: 'partner', value: 'partner' },
	{ name: 'friends', value: 'friend' },
	{ name: 'family', value: 'family' },
	{ name: 'taxi', value: 'taxi' },
	{ name: 'delivery', value: 'delivery' },
	{ name: 'technician', value: 'technician' },
	{ name: 'other', value: 'other' },
];

export default function AddGuestWeb() {
	const router = useRouter();

	const [name, setName] = useState<string>('');
	const [selectedGender, setSelectedGender] = useState<GenderType>('female');
	const [selectedRelationships, setSelectedRelationships] = useState<RelationshipType>('friend');
	const [otherRelationship, setOtherRelationship] = useState<string>('');
	const [saveToList, setSaveToList] = useState<boolean>(false);
	const [running, setRunning] = useState<boolean>(false);
	const [error, setError] = useState('');
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();

	const inputChecks = (): boolean => {
		if (!name.trim()) {
			setError("Please enter the guest's name.");
			return false;
		}

		if (!selectedGender) {
			setError('Please select a gender.');
			return false;
		}

		if (selectedRelationships == 'other' && !otherRelationship.trim()) {
			setError('Please select or enter a relationship.');
			return false;
		}

		return true;
	};

	async function handleSaveGuest() {
		if (inputChecks()) {
			setRunning(true);
			try {
				await createGuest({
					resident_id: useUserStore.getState().user_id,
					guest_name: name,
					relationship: selectedRelationships,
					gender: selectedGender,
				});

				router.push('/user');
			} catch (error) {
				setError('Failed to generate code. Please try again.');
			} finally {
				setRunning(false);
			}
		}
	}

	async function handleGenerateCode() {
		if (inputChecks()) {
			setRunning(true);
			try {
				const result = await generateCode({
					user_id: useUserStore.getState().user_id,
					estate_id: useUserStore.getState().estate_id ?? '',
					visitor_fullname: name,
					relationship_with_resident: selectedRelationships,
					gender: selectedGender,
				});

				if (saveToList) {
					await createGuest({
						resident_id: useUserStore.getState().user_id,
						guest_name: name,
						relationship: selectedRelationships,
						gender: selectedGender,
					});
				}

				let { formattedDate, timeframe } = timeCalc(result.valid_until);

				router.push({
					pathname: `/invite`,
					params: {
						code: result.hashed_code,
						name,
						address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
						timeframe,
						date: formattedDate,
					},
				});
			} catch (error) {
				setError('Failed to generate code. Please try again.');
			} finally {
				setRunning(false);
			}
		}
	}

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Generate Code - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body pb-20">
				<div className={`flex flex-col justify-center gap-7 ${isLargeScreen ? 'mt-20' : 'mt-5'}`} />

				<div className="">
					<div className="flex justify-between">
						<h1 className={`${isLargeScreen ? 'text-4xl' : 'text-3xl font-ubuntu-medium'}`}>Add Guest</h1>

						{!isLargeScreen && <UserIcon />}
					</div>
					<p className="text-base text-tertiary mt-1">Fill in your guest details, it will take only a couple of minutes</p>
				</div>

				<div className="border-mini border-primary rounded-lg px-8 py-10 mt-10 bg-white flex flex-col gap-6 min-w-3xl">
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
							{GENDERS.map((g, index) => {
								const active = selectedGender === g.value;
								return (
									<div key={index} className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[##cfe7db]'} gap-3 cursor-pointer`} onClick={() => setSelectedGender(g.value as GenderType)}>
										<p className="text-primary capitalize">{g.name}</p>
										{active && <Image source={icons.checkIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />}
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
							{RELATIONSHIPS.map((r, index) => {
								const active = selectedRelationships === r.value;
								return (
									<div key={index} className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[##cfe7db]'} gap-3 cursor-pointer`} onClick={() => setSelectedRelationships(r.value as RelationshipType)}>
										<p className="text-primary capitalize">{r.name}</p>
										{active && <Image source={icons.checkIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />}
									</div>
								);
							})}
						</div>
					</div>

					{selectedRelationships === 'other' && (
						<div className="input-group-web flex !flex-row items-end !gap-4">
							<label htmlFor="other" className="input-label-web">
								Other:
							</label>

							<input name="other" placeholder="Specify other relationship" value={otherRelationship} onChange={(e) => setOtherRelationship(e.target.value)} className="input-style-web" />
						</div>
					)}
				</div>

				<div className="mt-4 flex items-center gap-4">
					<input
						type="checkbox"
						name="saveDetails"
						id="saveDetails"
						className="mt-1 p-2 h-4 w-4 border-2 outline-2 border-primary outline-primary"
						onChange={(e: ChangeEvent<HTMLInputElement>) => {
							const { checked } = e.target;
							setSaveToList(checked);
						}}
					/>
					<label htmlFor="saveDetails" className="mt-1">
						<span className="text-dark-teal text-sm">Save details to my guest list</span>
					</label>
				</div>

				<div className="mt-7 flex flex-row justify-end gap-3">
					<button className={`bg-dark-teal rounded-md px-10 py-3 ${running && 'cursor-not-allowed opacity-75'}`} disabled={running} onClick={handleSaveGuest}>
						<p className="text-white text-sm font-semibold">Save Guest</p>
					</button>

					<button className={`bg-primary rounded-md px-10 py-3 ${running && 'cursor-not-allowed opacity-75'}`} disabled={running} onClick={handleGenerateCode}>
						<p className="text-white text-sm font-semibold">Generate Code</p>
					</button>
				</div>

				{error && <Modal closeModal={() => setError('')} heading={'Validation Error'} message={error} cancelText={'Close'} />}
				<br />
			</div>
		</div>
	);
}
