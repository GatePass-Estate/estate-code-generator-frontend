import images from '@/src/constants/images';
import { validateCode } from '@/src/lib/api/codes';
import { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, Platform } from 'react-native';
import { GuestDetails } from '@/src/types/guests';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useAuth } from '@/src/hooks/useAuthContext';
import { router } from 'expo-router';
import { User } from '@/src/types/user';
import { getUserById } from '@/src/lib/api/user';

function InviteDetailsModal({ result, setModalOpen }: { result: GuestDetails | null; setModalOpen: (open: boolean) => void }) {
	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Invite details">
			<div className="absolute inset-0 bg-primary opacity-80" onClick={() => setModalOpen(false)} />
			<div className="relative w-full max-w-[700px] rounded-md shadow-[0_30px_50px_rgba(3,10,14,0.6)] bg-primary">
				<button onClick={() => setModalOpen(false)} aria-label="Close" className="absolute right-12 top-10 text-body text-[22px] bg-transparent border-none cursor-pointer p-2 leading-none">
					✕
				</button>

				<div className="bg-transparent px-14 py-11 text-body font-sans">
					<h2 className="m-0 text-xl font-semibold text-body">Invite Details</h2>

					<div className="text-center my-7">
						<div className="text-sm font-inter font-light">Access Code</div>
						<div className="text-[48px] tracking-[3px] font-bold font-UbuntuSans">
							{result?.code.slice(0, 3)} {result?.code.slice(3)}
						</div>
					</div>

					<h3 className="text-[14px] font-Inter font-normal mt-[18px] mb-3">Guest Details</h3>
					<div className="bg-accent text-primary rounded-lg p-5 mb-6">
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Name :</div>
							<div className="text-right text-[14px] capitalize">{result?.visitor_fullname}</div>
						</div>
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Gender :</div>
							<div className="text-right text-[14px] capitalize">{result?.gender}</div>
						</div>
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Relationship :</div>
							<div className="text-right text-[14px] capitalize">{result?.relationship_with_resident}</div>
						</div>
					</div>

					<h3 className="text-[14px] font-Inter font-normal mt-[18px] mb-3">Resident Details</h3>
					<div className="border-[0.5px] border-accent rounded-lg p-5 mb-3 bg-transparent">
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Name :</div>
							<div className="text-right text-[14px] capitalize">{result?.resident_name}</div>
						</div>
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Address :</div>
							<div className="text-right text-[14px]">{result?.resident_address}</div>
						</div>
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Email Address :</div>
							<div className="text-right text-[14px]">{result?.resident_email}</div>
						</div>
						<div className="flex justify-between items-start py-2 px-1">
							<div className="w-40 text-[14px]">Phone Number :</div>
							<div className="text-right text-[14px]">{result?.resident_phone_number}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function SearchCode({ setResult, setModalOpen }: { setResult: (data: GuestDetails) => void; setModalOpen: (open: boolean) => void }) {
	const inputCount = 6;
	const [values, setValues] = useState(Array(inputCount).fill(''));
	const inputsRef = useRef<HTMLInputElement[]>([]);
	const [isValidating, setIsValidating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	const handleChange = (index: number, value: string) => {
		const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 1);
		setErrorMessage('');
		// .toUpperCase();
		const next = [...values];
		next[index] = cleaned;
		setValues(next);

		if (cleaned && index < inputCount - 1) {
			inputsRef.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace' && !values[index] && index > 0) {
			inputsRef.current[index - 1]?.focus();
		} else if (e.key === 'ArrowLeft' && index > 0) {
			inputsRef.current[index - 1]?.focus();
		} else if (e.key === 'ArrowRight' && index < inputCount - 1) {
			inputsRef.current[index + 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const paste = e.clipboardData.getData('text').replace(/\s+/g, '');
		const chars = paste.slice(0, inputCount).split('');
		const next = [...values];
		// chars.forEach((ch, i) => (next[i] = ch.toUpperCase()));
		setValues(next);
		const nextIndex = Math.min(chars.length, inputCount - 1);
		inputsRef.current[nextIndex]?.focus();
	};

	const handleValidation = async () => {
		const entered = values.join('');
		if (entered.length < 6) {
			setErrorMessage('Please fill all 6 digits');
			return;
		}

		setIsValidating(true);
		setErrorMessage('');

		try {
			const result = await validateCode(entered);
			const resident = await getUserById(result.user_id);

			setValues(['', '', '', '', '', '']);
			setResult({
				visitor_fullname: result.visitor_fullname,
				relationship_with_resident: result.relationship_with_resident,
				gender: result.gender,
				resident_name: `${resident?.first_name ?? ''} ${resident?.last_name ?? ''}`,
				resident_address: resident?.home_address,
				resident_email: resident?.email,
				resident_phone_number: resident?.phone_number,
				code: result.hashed_code,
			} as GuestDetails);
			setModalOpen(true);
		} catch (err: any) {
			setErrorMessage(err.message ?? 'Invalid Code');
		} finally {
			setIsValidating(false);
		}
	};

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Validate Code - GatePass';
	}, []);

	return (
		<main className="text-center mt-4 py-12">
			<h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">Search Code</h1>
			<p className="text-[#6b7d86] text-sm mb-10">Enter Guest Code to Validate</p>

			<div className="flex justify-center gap-2 mb-7" aria-label="Guest code">
				{values.map((val, i) => (
					<label key={i} className="w-14 h-14 sm:w-16 sm:h-20 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-sm">
						<input
							ref={(el) => {
								if (el) inputsRef.current[i] = el;
							}}
							type="text"
							maxLength={1}
							aria-label={`digit-${i + 1}`}
							value={val}
							onChange={(e) => handleChange(i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(e, i)}
							onPaste={handlePaste}
							className="search-code-input-web"
						/>
					</label>
				))}
			</div>

			{errorMessage && <p className="text-danger text-center mt-5 text-base">{errorMessage}</p>}

			<button onClick={handleValidation} disabled={isValidating} className={`bg-primary text-white py-4 px-20 rounded-lg text-sm shadow-lg font-semibold mt-20 transition-all ${isValidating ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
				{isValidating ? 'Validating…' : 'Validate Code'}
			</button>
		</main>
	);
}

function Profile() {
	const { first_name, last_name, email, phone_number } = useUserStore.getState();
	const { signOut } = useAuth();

	const handleLogout = () => signOut();

	const handleEdit = () => {
		router.push('/security/edit');
	};

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'My Profile - GatePass';
	}, []);

	return (
		<main className="text-center py-12" role="main" aria-labelledby="profile-title">
			<h1 id="profile-title" className="text-3xl sm:text-5xl mb-2 text-black">
				My Profile
			</h1>
			<p className="text-tertiary text-sm mb-10">Your personal details</p>

			<div className="mb-8 w-[560px]">
				<section className="bg-primary text-white p-6 sm:p-10 rounded-lg max-w-full shadow-lg" aria-label="Profile details">
					<div className="grid grid-cols-2 sm:grid-cols-1 gap-y-10 py-6 gap-x-6 text-left">
						<div className="flex justify-between flex-col sm:flex-row sm:gap-1">
							<div className="text-white/75 text-sm">Name :</div>
							<div className="text-[#e6f2f4] text-sm">
								{first_name} {last_name}
							</div>
						</div>

						<div className="flex justify-between flex-col sm:flex-row sm:gap-1">
							<div className="text-white/75 text-sm">Email Address :</div>
							<div className="text-[#e6f2f4] text-sm break-all">{email}</div>
						</div>

						<div className="flex justify-between flex-col sm:flex-row sm:gap-1">
							<div className="text-white/75 text-sm">Phone Number :</div>
							<div className="text-[#e6f2f4] text-sm">{phone_number}</div>
						</div>
					</div>
				</section>

				<div className="flex flex-wrap justify-between gap-4 mt-8">
					<button onClick={handleLogout} aria-label="Log out" className="bg-white text-[#123b47] border border-accent rounded-lg py-3 px-7 text-sm hover:bg-gray-100 transition flex-grow">
						Log Out
					</button>

					<button onClick={handleEdit} aria-label="Edit request" className="bg-primary text-white rounded-lg py-3 px-7 text-sm hover:opacity-90 transition flex-grow">
						Edit Request
					</button>
				</div>
			</div>
		</main>
	);
}

export default function SecurityVerificationWeb() {
	const [activeTab, setActiveTab] = useState<'validateCode' | 'profile'>('validateCode');
	const [result, setResult] = useState<GuestDetails | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<ImageBackground source={images.securityBg} imageStyle={{ resizeMode: 'cover', alignSelf: 'center' }} className="min-h-screen font-UbuntuSans text-primary security-bg relative">
			<div className="mx-auto p-4 px-20 flex flex-col min-h-screen">
				<header className="flex items-center justify-center mt-5 pb-10">
					<Image source={images.logo} style={{ width: 100, height: 100 }} resizeMode="contain" className="absolute left-20" />

					<nav className="flex gap-4 items-center">
						<span onClick={() => setActiveTab('validateCode')} className={`text-primary text-sm px-4 py-2 font-semibold border-primary transition-all ${activeTab === 'validateCode' ? 'border-b-2 border-primary cursor-default font-bold' : 'cursor-pointer'}`}>
							Validate Code
						</span>

						<span onClick={() => setActiveTab('profile')} className={`text-primary text-sm px-4 py-2 font-semibold border-primary transition-all ${activeTab === 'profile' ? 'border-b-2 border-primary cursor-default font-bold' : 'cursor-pointer'}`}>
							My Profile
						</span>
					</nav>
				</header>

				<div className="mt-10">{activeTab === 'validateCode' ? <SearchCode setResult={setResult} setModalOpen={setModalOpen} /> : <Profile />}</div>

				{modalOpen && <InviteDetailsModal result={result} setModalOpen={setModalOpen} />}
			</div>
		</ImageBackground>
	);
}
