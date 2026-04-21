import { menuRoutes } from '@/app/(protected)/user/_layout';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createRequest, checkPendingRequests, updatePendingRequest } from '@/src/lib/api/requests';
import { RequestType, PendingRequestsResponse } from '@/src/types/requests';
import { getWidthBreakpoint } from '@/src/lib/helpers';

interface ChangedField {
	type: RequestType;
	old: string;
	new: string;
	label: string;
}

export const EditProfileForm = ({ centralize = false }: { centralize?: boolean }) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [success, setSuccess] = useState('');
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		address: '',
		phoneNumber: '',
	});

	const user = useUserStore.getState();
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();

	useEffect(() => {
		setFormData({
			firstName: user.first_name || '',
			lastName: user.last_name || '',
			email: user.email || '',
			address: user.home_address || '',
			phoneNumber: user.phone_number || '',
		});
	}, []);

	const handleSubmission = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors([]);
		setSuccess('');
		setLoading(true);

		const pendingChecks: Promise<PendingRequestsResponse>[] = [];
		const changedFields: ChangedField[] = [];

		if (formData.firstName !== user.first_name) {
			changedFields.push({
				type: 'first_name_change' as const,
				old: user.first_name || '',
				new: formData.firstName,
				label: 'First Name',
			});
			pendingChecks.push(checkPendingRequests('first_name_change'));
		}

		if (formData.lastName !== user.last_name) {
			changedFields.push({
				type: 'last_name_change' as const,
				old: user.last_name || '',
				new: formData.lastName,
				label: 'Last Name',
			});
			pendingChecks.push(checkPendingRequests('last_name_change'));
		}

		if (formData.email !== user.email) {
			changedFields.push({
				type: 'email_change' as const,
				old: user.email || '',
				new: formData.email,
				label: 'Email Address',
			});
			pendingChecks.push(checkPendingRequests('email_change'));
		}

		if (formData.address !== user.home_address) {
			changedFields.push({
				type: 'home_address_change' as const,
				old: user.home_address || '',
				new: formData.address,
				label: 'Address',
			});
			pendingChecks.push(checkPendingRequests('home_address_change'));
		}

		if (formData.phoneNumber !== user.phone_number) {
			changedFields.push({
				type: 'phone_number_change' as const,
				old: user.phone_number || '',
				new: formData.phoneNumber,
				label: 'Phone Number',
			});
			pendingChecks.push(checkPendingRequests('phone_number_change' as RequestType));
		}

		if (changedFields.length === 0) {
			setErrors(['No changes detected']);
			setLoading(false);
			return;
		}

		try {
			const pendingResults = await Promise.allSettled(pendingChecks);
			const createRequests: ChangedField[] = [];
			const updateRequests: { field: ChangedField; requestId: string }[] = [];
			const errorMessages: string[] = [];

			pendingResults.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					console.log(`Result = `, result);

					if (result.value.has_pending_request && result.value.pending_request) {
						updateRequests.push({ field: changedFields[index], requestId: result.value.pending_request.id });
					} else {
						createRequests.push(changedFields[index]);
					}
				} else {
					const error = result.reason;
					const errorMessage = error?.message || '';
					errorMessages.push(`Error checking ${changedFields[index].label}: ${errorMessage}`);
				}
			});

			if (errorMessages.length > 0) {
				setErrors(errorMessages);
			}

			const allRequests = [...createRequests, ...updateRequests.map((r) => r.field)];

			if (allRequests.length > 0) {
				try {
					await Promise.all([...createRequests.map((req) => createRequest(req.type as any, req.old, req.new)), ...updateRequests.map((req) => updatePendingRequest(req.requestId, req.field.new))]);

					const successMsg = allRequests.length === 1 ? '1 request submitted successfully. Awaiting admin approval.' : `${allRequests.length} requests submitted successfully. Awaiting admin approval.`;
					setSuccess(successMsg);

					setTimeout(() => {
						router.back();
					}, 1500);
				} catch (submitErr: any) {
					const submitMessage = submitErr?.message || 'Failed to submit requests';
					setErrors([submitMessage]);
				}
			} else if (errorMessages.length === 0) {
				setErrors(['No valid requests to submit']);
			}
		} catch (err: any) {
			const message = err?.message || 'Failed to submit edit requests';
			setErrors([message]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 px-5'}`}>
			<div className={`${!isLargeScreen && 'mt-5'}`}>
				<h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'} ${centralize && 'text-center'}`}>Edit Profile</h1>
				<p className={`text-base text-tertiary mt-1 ${centralize && 'text-center'}`}>Send a request to edit your personal details</p>
			</div>
			<form className="py-7 flex flex-col gap-6 min-w-[400px]  md:min-w-[500px] lg:min-w-[600px]" onSubmit={handleSubmission}>
				{errors.length > 0 && (
					<div className="space-y-2">
						{errors.map((error, idx) => (
							<div key={idx} className="text-danger font-medium p-3 bg-danger/20 rounded flex justify-between items-center">
								<span>{error}</span>
								<button type="button" onClick={() => setErrors(errors.filter((_, i) => i !== idx))} className="text-danger hover:opacity-70 font-bold text-lg">
									×
								</button>
							</div>
						))}
					</div>
				)}

				{success && (
					<div className="text-green-500 font-medium p-3 bg-green-500/20 rounded flex justify-between items-center">
						<span>{success}</span>
						<button type="button" onClick={() => setSuccess('')} className="text-green-500 hover:opacity-70 font-bold text-lg">
							×
						</button>
					</div>
				)}

				<div
					className=" bg-[#FBFEFF] border-micro
							 border-primary rounded-lg p-8 flex flex-col gap-6 "
				>
					<div className="flex flex-col gap-2">
						<label className="input-label-web">Name</label>
						<div className="flex gap-3">
							<input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input-style-web flex-1" required disabled={loading} />
							<input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input-style-web flex-1" required disabled={loading} />
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label className="input-label-web">Email Address</label>
						<input type="email" placeholder={`${useUserStore.getState().email}`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-style-web" required disabled={loading} />
					</div>

					{!centralize && (
						<div className="flex flex-col gap-2">
							<label className="input-label-web">Address</label>
							<input type="text" placeholder={`${useUserStore.getState().home_address}`} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-style-web" required disabled={loading} />
						</div>
					)}

					<div className="flex flex-col gap-2">
						<label className="input-label-web">Phone Number</label>
						<input type="text" placeholder={`${useUserStore.getState().phone_number}`} value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="input-style-web" disabled={loading} />
					</div>
				</div>

				<div className=" flex gap-4 pr-2 pl-14">
					<button onClick={() => router.back()} type="button" className={`text-primary font-medium py-3 px-14 flex-1 cursor-pointer ${centralize && 'border border-accent px-20 rounded-lg'}`} disabled={loading}>
						{centralize ? 'Back' : 'Cancel Request'}
					</button>

					<button type="submit" className={`self-end bg-primary text-white font-medium text-sm rounded-lg py-3 px-14 flex-1 cursor-pointer ${loading && 'opacity-65'}`} disabled={loading}>
						{loading ? 'Sending...' : 'Send Request'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default function EditProfile() {
	const router = useRouter();

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Edit Profile - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map((data) => data)} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<EditProfileForm />
			</div>
		</div>
	);
}
