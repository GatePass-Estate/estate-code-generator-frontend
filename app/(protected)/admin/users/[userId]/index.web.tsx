import WebSidebar from '@/src/components/web/WebSidebar';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, ChangeEvent } from 'react';
import { Image, Platform, ActivityIndicator } from 'react-native';
import WebNavLink from '@/src/components/web/WebNavLink';
import { menuRoutes } from '@/app/(protected)/user/_layout';
import { adminRoutes } from '../../_layout';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import { registerUser, activateUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { RegisterUserPayload } from '@/src/types/user';

const ROLES = [
	{ name: 'Resident', value: 'resident' },
	{ name: 'Security Personnel', value: 'security' },
];

const ID_TYPES = [
	{ name: 'Passport', value: 'passport' },
	{ name: 'Driver License', value: 'driver_license' },
	{ name: 'National ID', value: 'national_id' },
	{ name: 'Voter Card', value: 'voter_card' },
];

export default function RegisterUserWeb() {
	const [step, setStep] = useState(1);
	const [error, setError] = useState('');
	const [messageType, setMessageType] = useState<'success' | 'error'>('error');
	const [running, setRunning] = useState(false);
	const [processingAction, setProcessingAction] = useState<'continue' | 'save' | null>(null);

	// Step 1 fields
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [selectedRole, setSelectedRole] = useState<'resident' | 'security'>('resident');

	// Step 2 fields
	const [homeAddress, setHomeAddress] = useState('');
	const [idType, setIdType] = useState('');
	const [idNumber, setIdNumber] = useState('');

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Add User - Admin Access - GatePass';
	}, []);

	const pathname = usePathname();

	function onNavigate(route: string): void {
		router.push(route as any);
	}

	const validateStep1 = (): boolean => {
		if (!firstName.trim()) {
			setError('Please enter first name.');
			return false;
		}
		if (!lastName.trim()) {
			setError('Please enter last name.');
			return false;
		}
		if (!email.trim()) {
			setError('Please enter email address.');
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address.');
			return false;
		}
		if (!phone.trim()) {
			setError('Please enter phone number.');
			return false;
		}
		if (!password.trim()) {
			setError('Please enter a password.');
			return false;
		}
		if (password.length < 6) {
			setError('Password must be at least 6 characters.');
			return false;
		}
		return true;
	};

	const validateStep2 = (): boolean => {
		if (!homeAddress.trim()) {
			setError('Please enter home address.');
			return false;
		}
		if (!idNumber.trim()) {
			setError('Please enter ID number.');
			return false;
		}
		return true;
	};

	const handleNextStep = () => {
		if (validateStep1()) {
			setStep(2);
		}
	};

	const handleSaveUser = async () => {
		if (validateStep2()) {
			setRunning(true);
			setProcessingAction('save');
			try {
				const { estate_id } = useUserStore.getState();

				const payload: RegisterUserPayload = {
					first_name: firstName,
					last_name: lastName,
					email,
					phone_number: phone,
					role: selectedRole,
					gender: 'prefer_not_to_say',
					estate_id: estate_id || '',
					home_address: homeAddress,
					household_id: null,
				};

				const registeredUser = await registerUser(payload);

				if (registeredUser && registeredUser.id) {
					const activatedUser = await activateUser({
						user_id: registeredUser.id,
						new_password: password,
					});

					if (activatedUser) {
						setMessageType('success');
						setError('User registered and activated successfully!');
						// Reset form
						setFirstName('');
						setLastName('');
						setEmail('');
						setPhone('');
						setPassword('');
						setSelectedRole('resident');
						setHomeAddress('');
						setIdType('');
						setIdNumber('');
						setStep(1);

						setTimeout(() => {
							router.push('/admin');
						}, 2000);
					} else {
						setMessageType('error');
						setError('User registered but activation failed. Please try again.');
					}
				} else {
					setMessageType('error');
					setError('Failed to register user. Please try again.');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'An error occurred while registering user';
				setMessageType('error');
				setError(errorMessage);
			} finally {
				setRunning(false);
				setProcessingAction(null);
			}
		}
	};

	const handleBack = () => {
		if (step > 1) {
			setStep(step - 1);
		} else {
			router.push('/admin');
		}
	};

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for === 'web' || el.for === 'both').map((data) => data)} onNavigate={onNavigate} />

			<div className="web-body pb-20">
				<div className="mt-20 mb-10">
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
					</div>

					<div className="grid grid-cols-4 gap-9 md:grid-cols-12 mb-10">
						<div className="flex flex-col gap-5 w-full col-span-2">
							{adminRoutes.map(({ name, title, link, icon }, index) => {
								const isActive = pathname === link;

								return (
									<div key={name + index} onClick={() => onNavigate(link)} className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}>
										<Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
										<WebNavLink color="primary">{title}</WebNavLink>
									</div>
								);
							})}
						</div>

						<div className="col-span-10">
							<div className="mt-6">
								<h2 className="text-2xl font-ubuntu-medium text-primary">Register User</h2>
								<p className="text-base text-tertiary mt-1">Add new users, either resident or security personnel</p>
							</div>

							<div className="rounded-lg py-5 bg-white flex flex-col gap-6">
								{step === 1 ? (
									<>
										<div className="grid grid-cols-2 gap-6">
											<div className="input-group-web">
												<label htmlFor="firstName" className="input-label-web">
													Name
												</label>
												<input name="firstName" placeholder="Enter user name" value={firstName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} className="input-style-web" />
											</div>

											<div className="input-group-web">
												<label htmlFor="lastName" className="input-label-web">
													Last Name
												</label>
												<input name="lastName" placeholder="Enter last name" value={lastName} onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} className="input-style-web" />
											</div>
										</div>

										<div className="grid grid-cols-2 gap-6">
											<div className="input-group-web">
												<label htmlFor="email" className="input-label-web">
													Email Address
												</label>
												<input name="email" type="email" placeholder="Enter user email address" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} className="input-style-web" />
											</div>

											<div className="input-group-web">
												<label htmlFor="phone" className="input-label-web">
													Phone number
												</label>
												<input name="phone" placeholder="Enter phone number" value={phone} onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} className="input-style-web" />
											</div>
										</div>

										<div className="input-group-web">
											<label htmlFor="password" className="input-label-web">
												Create Password
											</label>
											<input name="password" type="password" placeholder="Enter password for user" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} className="input-style-web" />
										</div>

										<div className="input-group-web !flex-row !items-center !gap-6">
											<label htmlFor="role" className="input-label-web">
												Save As
											</label>
											<div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
												{ROLES.map((r, index) => {
													const active = selectedRole === r.value;
													return (
														<div key={r.value + index} className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[#cfe7db]'} gap-3 cursor-pointer`} onClick={() => setSelectedRole(r.value as 'resident' | 'security')}>
															<p className="text-primary">{r.name}</p>
															{active && <Image source={icons.checkIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />}
														</div>
													);
												})}
											</div>
										</div>
									</>
								) : (
									<>
										<div className="input-group-web">
											<label htmlFor="homeAddress" className="input-label-web">
												House Address
											</label>
											<input name="homeAddress" placeholder="Enter House address" value={homeAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setHomeAddress(e.target.value)} className="input-style-web" />
										</div>

										<div className="input-group-web">
											<label htmlFor="idType" className="input-label-web">
												Means of Identification
											</label>
											<div className="flex gap-4">
												<select value={idType} onChange={(e) => setIdType(e.target.value)} className="input-style-web">
													<option value="" selected disabled>
														Type of ID
													</option>
													{ID_TYPES.map((type, index) => (
														<option key={type.value + index} value={type.value}>
															{type.name}
														</option>
													))}
												</select>
												<input name="idNumber" placeholder="Type ID Number" value={idNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => setIdNumber(e.target.value)} className="input-style-web flex-1" />
											</div>
										</div>

										<div className="input-group-web"></div>
									</>
								)}

								<div className="mt-6 flex flex-row justify-end gap-3">
									{step == 2 && (
										<button className={`bg-dark-teal rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`} disabled={running} onClick={handleBack}>
											{processingAction === 'continue' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Back</p>}
										</button>
									)}

									{step === 1 ? (
										<button className={`bg-primary rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`} disabled={running} onClick={handleNextStep}>
											{processingAction === 'continue' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Continue</p>}
										</button>
									) : (
										<button className={`bg-primary rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`} disabled={running} onClick={handleSaveUser}>
											{processingAction === 'save' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Save User</p>}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{error && <Modal closeModal={() => setError('')} heading={messageType === 'success' ? 'Success' : 'Validation Error'} message={error} cancelText={'Close'} />}
			</div>
		</div>
	);
}
