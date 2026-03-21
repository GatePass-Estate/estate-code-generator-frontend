import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, View, Text, ScrollView, Pressable, Image, ActivityIndicator, useWindowDimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@/src/components/nativewindui/Button';
import { useAuth } from '@/src/hooks/useAuthContext';
import { acceptTos, fetchMe } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { broadcastLogin, getWidthBreakpoint, storeAuthState } from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { UserRolesType } from '@/src/types/general';

const TOS_SECTIONS = [
	{
		id: 'introduction',
		title: '1. Introduction',
		content:
			'Welcome to [App Name], operated by [Company Name] ("we", "our", "us"). These Terms of Service ("Terms") govern your access to and use of our software application, website, products, and related services (collectively, the "Service").\nBy accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you must discontinue use immediately.',
	},
	{
		id: 'eligibility',
		title: '2. Eligibility',
		content: 'To use the Service, you must:',
		bullets: [
			'Be at least 18 years old (or the age of legal majority in your jurisdiction)',
			'Have the legal capacity to enter into a binding agreement',
			'Use the Service in compliance with all applicable laws and regulations',
		],
		footer:
			'If you are using the Service on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.',
	},
	{
		id: 'user-accounts',
		title: '3. User Accounts',
		content: 'To access certain features, you may be required to create an account. You agree to:',
		bullets: [
			'Provide accurate and complete information',
			'Keep your login credentials secure',
			'Notify us immediately of any unauthorised access',
			'Accept responsibility for all activities under your account',
		],
		footer: 'We reserve the right to suspend or terminate accounts that violate these Terms.',
	},
	{
		id: 'acceptable-use',
		title: '4. Acceptable Use',
		content: 'You agree not to:',
		bullets: [
			'Use the Service for unlawful, harmful, or fraudulent purposes',
			'Interfere with or disrupt the Service',
			'Attempt to gain unauthorised access to systems or data',
			'Upload malicious code, viruses, or harmful content',
			'Infringe on the rights of others, including intellectual property rights',
			'Use automated tools (bots, scrapers) without permission',
		],
		footer: 'We may investigate and take action, including account suspension, for violations.',
	},
	{
		id: 'intellectual-property',
		title: '5. Intellectual Property',
		content:
			'All content, trademarks, logos, software, and materials provided through the Service are the exclusive property of [Company Name] or its licensors.\nYou are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for personal or internal business purposes.\nYou may not:',
		bullets: [
			'Copy, modify, distribute, or create derivative works',
			'Reverse engineer or decompile the software',
			'Remove copyright or proprietary notices',
		],
	},
	{
		id: 'user-content',
		title: '6. User-Generated Content',
		content:
			'If you submit, upload, or share content ("User Content"), you grant us a worldwide, royalty-free, non-exclusive license to use, store, reproduce, and display that content solely for operating and improving the Service.\nYou represent that:',
		bullets: [
			'You own or have rights to the User Content',
			'Your content does not violate any laws or third-party rights',
		],
		footer: 'We reserve the right to remove content that violates these Terms.',
	},
	{
		id: 'privacy',
		title: '7. Privacy and Data Protection',
		content:
			'Your use of the Service is also governed by our Privacy Policy and Data Protection Policy, which explain how we collect, use, and protect your personal data.\nWe comply with the Nigeria Data Protection Act (NDPA) 2023 and other applicable laws.',
	},
	{
		id: 'payments',
		title: '8. Payments and Subscriptions',
		content: 'If the Service includes paid features:',
		bullets: [
			'Prices and billing cycles will be clearly displayed',
			'Payments are processed through authorised third-party providers',
			'Subscription fees are non-refundable unless required by law',
			'You may cancel your subscription at any time, but access continues until the end of the billing period',
		],
		footer: 'We may change pricing with prior notice.',
	},
	{
		id: 'third-party',
		title: '9. Third-Party Services',
		content: 'The Service may integrate with third-party tools or platforms. We are not responsible for:',
		bullets: [
			'The content, policies, or practices of third-party services',
			'Any loss or damage arising from their use',
		],
		footer: 'Your use of third-party services is subject to their own terms.',
	},
	{
		id: 'availability',
		title: '10. Service Availability and Modifications',
		content: 'We strive to maintain reliable service but do not guarantee:',
		bullets: [
			'Uninterrupted access',
			'Error-free operation',
			'Complete security',
		],
		footer:
			'We may modify, suspend, or discontinue any part of the Service at any time, with or without notice.',
	},
	{
		id: 'termination',
		title: '11. Termination',
		content: 'We may suspend or terminate your access if you:',
		bullets: [
			'Violate these Terms',
			'Engage in harmful or illegal activities',
			'Misuse the Service',
		],
		footer:
			'Upon termination:\nYour right to use the Service ends immediately.\nCertain provisions (e.g., intellectual property, disclaimers) will continue to apply.',
	},
	{
		id: 'disclaimers',
		title: '12. Disclaimers',
		content:
			'The Service is provided "as is" and "as available" without warranties of any kind, including:',
		bullets: [
			'Remotely related features not expressly stated',
			'Fitness for a particular purpose',
			'Non-infringement',
			'Accuracy or reliability',
		],
		footer: 'You use the Service at your own risk.',
	},
	{
		id: 'liability',
		title: '13. Limitation of Liability',
		content: 'To the fullest extent permitted by law, [Company Name] is not liable for:',
		bullets: [
			'Indirect, incidental, or consequential damages',
			'Loss of data, profits, or business',
			'Unauthorised access to your information',
			'Errors or interruptions in the Service',
		],
		footer:
			'Our total liability will not exceed the amount you paid for the Service in the last 12 months (if applicable).',
	},
	{
		id: 'indemnification',
		title: '14. Indemnification',
		content:
			'You agree to indemnify and hold [Company Name] harmless from any claims, damages, or losses arising from:',
		bullets: [
			'Your use of the Service',
			'Your violation of these Terms',
			'Your infringement of third-party rights',
		],
	},
	{
		id: 'governing-law',
		title: '15. Governing Law and Dispute Resolution',
		content:
			'These Terms are governed by the laws of the Federal Republic of Nigeria.\nDisputes will be resolved through:',
		bullets: ['Negotiation, then', 'Mediation, and if unresolved,', 'Courts of competent jurisdiction in Nigeria'],
	},
	{
		id: 'changes',
		title: '16. Changes to These Terms',
		content: 'We may update these Terms periodically. When changes are made:',
		bullets: [
			'We will update the "Last Updated" date',
			'Continued use of the Service constitutes acceptance of the revised Terms',
		],
	},
	{
		id: 'contact',
		title: '17. Contact Information',
		content:
			'For questions or concerns about these Terms, contact us at:\n[Company Name]\nPhone: [Phone Number]\nAddress: [Company Address]',
		email: 'info@gatepassng.com',
	},
];

export default function TermsOfService() {
	const router = useRouter();
	const { signIn } = useAuth();
	const { width } = useWindowDimensions();
	const params = useLocalSearchParams<{ token: string; role: string }>();
	const [isAccepting, setIsAccepting] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [activeSection, setActiveSection] = useState('introduction');
	const scrollViewRef = useRef<ScrollView>(null);
	const sectionRefs = useRef<Record<string, number>>({});

	const isLargeScreen = width > getWidthBreakpoint();

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Terms of Service - GatePass';
	}, []);

	const handleAccept = useCallback(async () => {
		if (!params.token) return;
		setIsAccepting(true);
		setErrorMessage('');

		try {
			const result = await acceptTos(params.token);
			const token = result.access_token;
			const role = result.role || (params.role as UserRolesType);

			useAuthStore.setState({ access_token: token, role });
			await storeAuthState({ access_token: token, role });
			broadcastLogin(token, role);
			signIn(await fetchMe(token));

			if (role === 'resident' || ['primary_admin', 'admin'].includes(role!)) {
				router.replace('/user');
			} else if (role === 'security') {
				router.replace('/security');
			}
		} catch (error: any) {
			setErrorMessage(error.message || 'Failed to accept Terms of Service');
		} finally {
			setIsAccepting(false);
		}
	}, [params.token, params.role, signIn, router]);

	const handleReject = useCallback(() => {
		setIsRejecting(true);
		router.replace('/auth/login');
	}, [router]);

	const handleSectionPress = (sectionId: string) => {
		setActiveSection(sectionId);
		const yPosition = sectionRefs.current[sectionId];
		if (yPosition !== undefined && scrollViewRef.current) {
			scrollViewRef.current.scrollTo({ y: yPosition - 20, animated: true });
		}
	};

	const handleSectionLayout = (sectionId: string, y: number) => {
		sectionRefs.current[sectionId] = y;
	};

	if (isLargeScreen) {
		return (
			<SafeAreaView className="h-full bg-white">
				<View className="flex-row flex-1">
					<View className="w-72 border-r border-[#E5E7EB] p-8 justify-between">
						<View>
							<Image
								source={Images.logo}
								style={{ width: 160, height: 50 }}
								resizeMode="contain"
							/>
							<View className="mt-12 gap-2">
								{TOS_SECTIONS.map((section) => (
									<Pressable
										key={section.id}
										onPress={() => handleSectionPress(section.id)}
										className="flex-row items-center"
									>
										<View
											className="w-1 h-8 rounded-full mr-3"
											style={{
												backgroundColor: activeSection === section.id ? '#113E55' : 'transparent',
											}}
										/>
										<Text
											className="font-Inter text-sm"
											style={{
												color: activeSection === section.id ? '#113E55' : '#9B9797',
												fontWeight: activeSection === section.id ? '600' : '400',
											}}
										>
											{section.title.replace(/^\d+\.\s/, '')}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
						<Pressable
							onPress={handleReject}
							className="border border-[#D1D5DB] rounded-lg py-3 px-6 items-center mt-8"
						>
							<Text className="font-UbuntuSans text-sm text-black">Back to login</Text>
						</Pressable>
					</View>

					<ScrollView
						ref={scrollViewRef}
						className="flex-1"
						contentContainerStyle={{ padding: 48, paddingBottom: 80 }}
						showsVerticalScrollIndicator={false}
					>
						<Text className="font-UbuntuSans text-4xl text-primary">
							Terms of Service
						</Text>
						<Text className="font-Inter text-base text-orange mt-2">
							Last Updated: 20th March 2026.
						</Text>

						<View className="bg-[#F8F8F8] rounded-2xl p-8 mt-8">
							{TOS_SECTIONS.map((section, index) => (
								<View
									key={section.id}
									onLayout={(e) => handleSectionLayout(section.id, e.nativeEvent.layout.y)}
									className={index > 0 ? 'mt-8' : ''}
								>
									<Text className="font-UbuntuSans text-xl text-black font-semibold">
										{section.title}
									</Text>
									<Text className="font-Inter text-sm text-[#4B5563] mt-3 leading-5">
										{section.content}
									</Text>
									{section.bullets && (
										<View className="mt-2 ml-4">
											{section.bullets.map((bullet, i) => (
												<View key={i} className="flex-row mt-1">
													<Text className="font-Inter text-sm text-[#4B5563]">• </Text>
													<Text className="font-Inter text-sm text-[#4B5563] flex-1">
														{bullet}
													</Text>
												</View>
											))}
										</View>
									)}
									{section.footer && (
										<Text className="font-Inter text-sm text-[#4B5563] mt-3 leading-5">
											{section.footer}
										</Text>
									)}
									{section.email && (
										<Pressable onPress={() => Linking.openURL(`mailto:${section.email}`)} className="mt-2">
											<Text className="font-Inter text-sm text-primary underline">
												Email us
											</Text>
										</Pressable>
									)}
								</View>
							))}
						</View>

						{errorMessage ? (
							<View className="bg-red-50 p-4 rounded-lg mt-6">
								<Text className="text-danger font-Inter text-sm">{errorMessage}</Text>
							</View>
						) : null}

						<View className="mt-10 gap-4 max-w-2xl self-center w-full">
							<Button
								className="rounded-lg h-14 items-center justify-center"
								size={Platform.select({ ios: 'lg', default: 'lg' })}
								onPress={handleAccept}
								disabled={isAccepting}
							>
								{isAccepting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text className="text-white font-UbuntuSans font-semibold text-base">
										I Accept
									</Text>
								)}
							</Button>
							<Button
								className="rounded-lg h-14 items-center justify-center bg-teal"
								size={Platform.select({ ios: 'lg', default: 'lg' })}
								onPress={handleReject}
								disabled={isRejecting}
							>
								{isRejecting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text className="text-white font-UbuntuSans font-semibold text-base">
										I Reject
									</Text>
								)}
							</Button>
						</View>
					</ScrollView>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View className="flex-row justify-between items-center px-5 pt-4">
				<Pressable onPress={handleReject} className="flex-row items-center">
					<AntDesign name="left" size={16} color="#04121A" />
					<Text className="font-Inter text-base text-black ml-1">Back</Text>
				</Pressable>
				<Image
					source={Images.logo}
					style={{ width: 36, height: 36 }}
					resizeMode="contain"
				/>
			</View>

			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<Text className="font-UbuntuSans text-2xl text-black font-bold mt-6">
					Terms of Service
				</Text>
				<Text className="font-Inter text-sm text-orange mt-1">
					Last Updated: 20th March 2026.
				</Text>

				<View className="bg-[#F8F8F8] rounded-2xl p-5 mt-6">
					{TOS_SECTIONS.map((section, index) => (
						<View
							key={section.id}
							onLayout={(e) => handleSectionLayout(section.id, e.nativeEvent.layout.y)}
							className={index > 0 ? 'mt-6' : ''}
						>
							<Text className="font-UbuntuSans text-lg text-black font-semibold">
								{section.title}
							</Text>
							<Text className="font-Inter text-sm text-[#4B5563] mt-2 leading-5">
								{section.content}
							</Text>
							{section.bullets && (
								<View className="mt-2 ml-4">
									{section.bullets.map((bullet, i) => (
										<View key={i} className="flex-row mt-1">
											<Text className="font-Inter text-sm text-[#4B5563]">• </Text>
											<Text className="font-Inter text-sm text-[#4B5563] flex-1">
												{bullet}
											</Text>
										</View>
									))}
								</View>
							)}
							{section.footer && (
								<Text className="font-Inter text-sm text-[#4B5563] mt-3 leading-5">
									{section.footer}
								</Text>
							)}
							{section.email && (
								<Pressable onPress={() => Linking.openURL(`mailto:${section.email}`)} className="mt-2">
									<Text className="font-Inter text-sm text-primary underline">
										Email us
									</Text>
								</Pressable>
							)}
						</View>
					))}
				</View>

				{errorMessage ? (
					<View className="bg-red-50 p-4 rounded-lg mt-4">
						<Text className="text-danger font-Inter text-sm">{errorMessage}</Text>
					</View>
				) : null}

				<View className="mt-8 gap-4 items-center">
					<Button
						className="rounded-lg h-14 items-center justify-center w-10/12"
						size={Platform.select({ ios: 'lg', default: 'lg' })}
						onPress={handleAccept}
						disabled={isAccepting}
					>
						{isAccepting ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-white font-UbuntuSans font-semibold text-base">
								I Accept
							</Text>
						)}
					</Button>
					<Button
						className="rounded-lg h-14 items-center justify-center w-10/12 bg-teal"
						size={Platform.select({ ios: 'lg', default: 'lg' })}
						onPress={handleReject}
						disabled={isRejecting}
					>
						{isRejecting ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-white font-UbuntuSans font-semibold text-base">
								I Reject
							</Text>
						)}
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
