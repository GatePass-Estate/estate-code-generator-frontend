import { useEffect } from 'react';
import { Platform } from 'react-native';
import { EditProfileForm } from '../../(shared-screens)/profile/edit/index.web';

export default function EditSecurityProfileWeb() {
	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Edit Profile - GatePass';
	}, []);

	return (
		<div className="flex justify-center items-center overflow-y-auto">
			<div className="max-w-[650px] py-10">
				<EditProfileForm centralize={true} />
			</div>
		</div>
	);
}
