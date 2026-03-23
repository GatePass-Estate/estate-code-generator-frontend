import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AntDesign, Feather } from '@expo/vector-icons';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { Button } from '@/src/components/nativewindui/Button';

type PolicySection = {
	id: string;
	title: string;
	content: string;
	bullets?: string[];
	subSections?: { title: string; content?: string; bullets?: string[] }[];
	footer?: string;
};

const POLICY_SECTIONS: PolicySection[] = [
	{
		id: 'purpose',
		title: '1. Purpose of This Policy',
		content: 'This Data Protection Policy establishes the framework through which GATE PASS NG collects, processes, stores, shares, and protects personal data in compliance with the Nigeria Data Protection Act (NDPA) 2023 and all directives issued by the Nigeria Data Protection Commission (NDPC).\nThe policy ensures that all personal data handled by the company is managed responsibly, securely, and transparently.',
	},
	{
		id: 'scope',
		title: '2. Scope',
		content: 'This policy applies to:',
		bullets: [
			'All employees, contractors, consultants, and temporary staff of GATE PASS NG',
			'All software applications, platforms, websites, and digital services operated by the company',
			'All personal data processed in electronic or manual form',
			'All third-party processors acting on behalf of the company'
		],
		footer: 'This policy covers personal data belonging to customers, users, employees, partners, vendors, and any other identifiable individuals.',
	},
	{
		id: 'definitions',
		title: '3. Definitions',
		content: '',
		bullets: [
			'Personal Data: Any information relating to an identified or identifiable natural person (data subject).',
			'Sensitive Personal Data: Includes health data, biometric data, financial information, sexual orientation, religious beliefs, etc.',
			'Processing: Any operation performed on personal data, including collection, storage, retrieval, transmission, or deletion.',
			'Data Controller: GATE PASS NG, which determines the purpose and means of processing personal data.',
			'Data Processor: Any third party that processes personal data on behalf of the company.',
			'Data Subject: Any individual whose personal data is processed by the company.',
			'DPO: Data Protection Officer appointed to oversee compliance.'
		],
	},
	{
		id: 'principles',
		title: '4. Data Protection Principles',
		content: 'GATE PASS NG adheres to the following principles as required by the NDPA:',
		subSections: [
			{ title: '4.1 Lawfulness, Fairness, and Transparency', content: 'Personal data is processed lawfully, fairly, and in a transparent manner.' },
			{ title: '4.2 Purpose Limitation', content: 'Data is collected for specific, explicit, and legitimate purposes and not processed beyond those purposes.' },
			{ title: '4.3 Data Minimisation', content: 'Only data that is adequate, relevant, and necessary is collected.' },
			{ title: '4.4 Accuracy', content: 'Personal data must be accurate and kept up to date.' },
			{ title: '4.5 Storage Limitation', content: 'Data is retained only for as long as necessary for the purposes for which it was collected.' },
			{ title: '4.6 Integrity and Confidentiality', content: 'Data is processed securely to prevent unauthorised access, loss, or damage.' },
			{ title: '4.7 Accountability', content: 'The company is responsible for demonstrating compliance with all data protection obligations.' }
		]
	},
	{
		id: 'legal-basis',
		title: '5. Legal Basis for Processing Personal Data',
		content: 'The company processes personal data only when one or more of the following legal bases apply:',
		bullets: [
			'Consent from the data subject',
			'Performance of a contract with the data subject',
			'Compliance with legal obligations',
			'Protection of vital interests of Data Subject',
			'Legitimate interests pursued by the company',
			'Public interest (where applicable)'
		]
	},
	{
		id: 'categories',
		title: '6. Categories of Personal Data Collected',
		content: 'Depending on the nature of the software application, the company may collect:',
		bullets: [
			'Identity data (name, username, date of birth)',
			'Contact data (email, phone number, address)',
			'Device and technical data (IP address, device ID, OS version)',
			'Usage data (app interactions, preferences, logs)',
			'Financial or payment data (where applicable)',
			'Location data (with consent)',
			'Sensitive personal data (only when strictly necessary and with explicit consent)'
		]
	},
	{
		id: 'collection-methods',
		title: '7. Data Collection Methods',
		content: 'Data may be collected through:',
		bullets: [
			'User registration forms',
			'App usage and analytics tools',
			'Customer support interactions',
			'Cookies and tracking technologies',
			'Third-party integrations (with user consent)'
		]
	},
	{
		id: 'subject-rights',
		title: '8. Data Subject Rights',
		content: 'In accordance with the NDPA, data subjects have the right to:',
		bullets: [
			'Access their personal data',
			'Request rectification of inaccurate data',
			'Request deletion of their data',
			'Withdraw consent at any time',
			'Object to processing',
			'Request data portability',
			'Restrict processing',
			'Lodge complaints with the NDPC'
		],
		footer: 'The company provides clear channels for exercising these rights.'
	},
	{
		id: 'security',
		title: '9. Data Security Measures',
		content: 'The company implements robust technical and organisational measures, including:',
		subSections: [
			{
				title: 'Technical Measures',
				bullets: [
					'Encryption of data in transit and at rest',
					'Secure coding practices',
					'Multi-factor authentication',
					'Firewalls and intrusion detection systems',
					'Regular vulnerability assessments and penetration testing'
				]
			},
			{
				title: 'Organisational Measures',
				bullets: [
					'Staff training on data protection',
					'Access control policies',
					'Confidentiality agreements',
					'Incident response and breach reporting procedures',
					'Regular compliance audits'
				]
			}
		]
	},
	{
		id: 'breach-management',
		title: '10. Data Breach Management',
		content: 'In the event of a data breach:',
		bullets: [
			'The DPO will activate the incident response plan.',
			'The NDPC will be notified within the legally required timeframe.',
			'Affected individuals will be informed where the breach poses a risk to their rights.',
			'Remedial actions will be taken to prevent recurrence.'
		]
	},
	{
		id: 'sharing',
		title: '11. Data Sharing and Third-Party Processing',
		content: 'Personal data may be shared only when:',
		bullets: [
			'Required by law',
			'Necessary for service delivery',
			'The data subject has provided consent'
		],
		subSections: [
			{
				title: 'All third-party processors must:',
				bullets: [
					'Sign a Data Processing Agreement (DPA)',
					'Implement adequate security measures',
					'Comply with NDPA requirements'
				]
			}
		]
	},
	{
		id: 'cross-border',
		title: '12. Cross-Border Data Transfers',
		content: 'Where data must be transferred outside Nigeria, the company ensures:',
		bullets: [
			'The receiving country has adequate data protection safeguards, or',
			'Standard contractual clauses and protective measures are in place'
		],
		footer: 'Transfers are conducted strictly in line with NDPC guidelines.'
	},
	{
		id: 'retention',
		title: '13. Data Retention and Disposal',
		content: 'Data is retained after the point of account deletion for five (5) years to fulfil its purpose or meet legal obligations except explicitly requested by the data subject.\nUpon expiration of the retention period, data is:',
		bullets: [
			'Securely deleted',
			'Anonymised',
			'Archived (where legally required)'
		]
	},
	{
		id: 'roles',
		title: '14. Roles and Responsibilities',
		content: '',
		subSections: [
			{
				title: '14.1 Management',
				content: 'Responsible for ensuring adequate resources and oversight.'
			},
			{
				title: '14.2 Data Protection Officer (DPO)',
				content: 'The DPO oversees:',
				bullets: [
					'Compliance monitoring',
					'Staff training',
					'Data protection impact assessments',
					'Breach management',
					'Communication with the NDPC'
				]
			},
			{
				title: '14.3 Employees',
				content: 'All staff must:',
				bullets: [
					'Follow this policy',
					'Report suspected breaches',
					'Maintain confidentiality'
				]
			}
		]
	},
	{
		id: 'dpia',
		title: '15. Data Protection Impact Assessments (DPIA)',
		content: 'DPIAs are conducted for:',
		bullets: [
			'New products or features involving personal data',
			'High-risk processing activities',
			'Use of sensitive personal data',
			'Automated decision-making or profiling'
		]
	},
	{
		id: 'cookies',
		title: '16. Use of Cookies and Tracking Technologies',
		content: 'The company uses cookies and similar technologies to:',
		bullets: [
			'Improve user experience',
			'Analyse usage patterns',
			'Personalise content'
		],
		footer: 'Users are informed and may manage cookie preferences.'
	},
	{
		id: 'review',
		title: '17. Policy Review',
		content: 'This policy is reviewed annually or whenever:',
		bullets: [
			'Laws or regulations change',
			'New processing activities are introduced',
			'Significant organisational changes occur'
		]
	},
	{
		id: 'contact',
		title: '18. Contact Information',
		content: 'For inquiries or to exercise data rights, contact:',
		bullets: [
			'Data Protection Officer (DPO)',
			'[Name]',
			'[Email Address]',
			'[Phone Number]',
			'[Company Address]'
		]
	}
];

export default function DataProtectionPolicy() {
	const router = useRouter();
	const { width } = useWindowDimensions();
	const isLargeScreen = width > getWidthBreakpoint();

	const [activeSection, setActiveSection] = useState('purpose');
	const scrollViewRef = useRef<ScrollView>(null);
	const sectionRefs = useRef<Record<string, number>>({});

	useEffect(() => {
		if (Platform.OS === 'web') {
			document.title = 'Data Protection Policy - GatePass';
		}
	}, []);

	const handleSectionPress = (sectionId: string) => {
		setActiveSection(sectionId);
		const yOffset = sectionRefs.current[sectionId];
		if (yOffset !== undefined && scrollViewRef.current) {
			scrollViewRef.current.scrollTo({ y: yOffset - 40, animated: true });
		}
	};

	const handleSectionLayout = (id: string, layoutY: number) => {
		sectionRefs.current[id] = layoutY;
	};

	const handleScroll = (event: any) => {
		const scrollPosition = event.nativeEvent.contentOffset.y;
		let currentSection = POLICY_SECTIONS[0].id;

		for (const section of POLICY_SECTIONS) {
			const yOffset = sectionRefs.current[section.id];
			if (yOffset !== undefined && scrollPosition >= yOffset - 100) {
				currentSection = section.id;
			}
		}

		if (currentSection !== activeSection) {
			setActiveSection(currentSection);
		}
	};

	if (isLargeScreen) {
		return (
			<SafeAreaView className="flex-1 bg-white flex-row">
				<View className="w-[320px] bg-white border-r border-[#E5E7EB] p-8 h-full">
					<View className="flex-1 mb-6">
						<Text className="font-UbuntuSans font-semibold text-lg text-black mb-6">
							Data Protection Policy
						</Text>
						<View>
							{POLICY_SECTIONS.map((section) => (
								<Pressable
									key={section.id}
									onPress={() => handleSectionPress(section.id)}
									className={`py-2 px-3 rounded-lg flex-row items-center mb-1 transition-colors`}
								>
									{activeSection === section.id && (
										<View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
									)}
									<Text
										className={`font-UbuntuSans text-sm ${
											activeSection === section.id ? 'text-primary font-bold' : 'text-[#4B5563]'
										}`}
										numberOfLines={1}
									>
										{section.title}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
					<Pressable
						onPress={() => router.back()}
						className="border border-[#D1D5DB] rounded-lg py-3 px-6 items-center"
					>
						<Text className="font-UbuntuSans text-sm text-black">Back to Terms</Text>
					</Pressable>
				</View>

				<ScrollView
					ref={scrollViewRef}
					className="flex-1"
					contentContainerStyle={{ padding: 48, paddingBottom: 80 }}
					onScroll={handleScroll}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
				>
					<Text className="font-UbuntuSans text-4xl text-primary">
						Data Protection Policy
					</Text>
					<Text className="font-Inter text-base text-orange mt-2">
						GATE PASS NG
					</Text>

					<View className="bg-[#F8F8F8] rounded-2xl p-8 mt-8">
						{POLICY_SECTIONS.map((section, index) => (
							<View
								key={section.id}
								onLayout={(e) => handleSectionLayout(section.id, e.nativeEvent.layout.y)}
								className={index > 0 ? 'mt-8' : ''}
							>
								<Text className="font-UbuntuSans text-2xl text-black font-semibold mb-3">
									{section.title}
								</Text>
								{section.content ? (
									<Text className="font-Inter text-sm text-[#4B5563] leading-6 mb-3">
										{section.content}
									</Text>
								) : null}

								{section.bullets && (
									<View className="mb-3">
										{section.bullets.map((bullet, idx) => (
											<View key={idx} className="flex-row mb-2 pr-4">
												<Text className="text-[#4B5563] mr-2 text-sm leading-6">•</Text>
												<Text className="font-Inter text-sm text-[#4B5563] leading-6 flex-1">
													{bullet}
												</Text>
											</View>
										))}
									</View>
								)}

								{section.subSections && section.subSections.map((sub, sIdx) => (
									<View key={sIdx} className="mt-4 mb-2 ml-4">
										<Text className="font-UbuntuSans text-lg text-black font-medium mb-2">
											{sub.title}
										</Text>
										{sub.content && (
											<Text className="font-Inter text-sm text-[#4B5563] leading-6 mb-2">
												{sub.content}
											</Text>
										)}
										{sub.bullets && (
											<View className="mt-2">
												{sub.bullets.map((bullet, idx) => (
													<View key={idx} className="flex-row mb-2 pr-4">
														<Text className="text-[#4B5563] mr-2 text-sm leading-6">-</Text>
														<Text className="font-Inter text-sm text-[#4B5563] leading-6 flex-1">
															{bullet}
														</Text>
													</View>
												))}
											</View>
										)}
									</View>
								))}

								{section.footer && (
									<Text className="font-Inter text-sm text-[#4B5563] leading-6 mt-2">
										{section.footer}
									</Text>
								)}
							</View>
						))}
					</View>

					<View className="flex-row justify-end mt-12 mb-8">
						<Pressable
							onPress={() => router.back()}
							className="bg-primary rounded-lg py-3 px-8"
						>
							<Text className="text-white font-UbuntuSans font-semibold text-base">
								Return to Terms of Service
							</Text>
						</Pressable>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
				<Pressable onPress={() => router.back()} className="mr-4 p-2">
					<AntDesign name="arrow-left" size={24} color="#113E55" />
				</Pressable>
				<Text className="font-UbuntuSans text-xl text-primary font-semibold">Data Protection Policy</Text>
			</View>

			<ScrollView
				ref={scrollViewRef}
				className="flex-1"
				contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
				showsVerticalScrollIndicator={false}
			>
				<Text className="font-UbuntuSans text-3xl text-primary">
					Data Protection Policy
				</Text>
				<Text className="font-Inter text-sm text-orange mt-2 mb-6">
					GATE PASS NG
				</Text>

				<View className="bg-[#F8F8F8] rounded-xl p-6">
					{POLICY_SECTIONS.map((section, index) => (
						<View
							key={section.id}
							onLayout={(e) => handleSectionLayout(section.id, e.nativeEvent.layout.y)}
							className={index > 0 ? 'mt-8' : ''}
						>
							<Text className="font-UbuntuSans text-xl text-black font-semibold mb-3">
								{section.title}
							</Text>
							{section.content ? (
								<Text className="font-Inter text-sm text-[#4B5563] leading-6 mb-3">
									{section.content}
								</Text>
							) : null}

							{section.bullets && (
								<View className="mb-3">
									{section.bullets.map((bullet, idx) => (
										<View key={idx} className="flex-row mb-2 pr-2">
											<Text className="text-[#4B5563] mr-2 text-sm leading-6">•</Text>
											<Text className="font-Inter text-sm text-[#4B5563] leading-6 flex-1">
												{bullet}
											</Text>
										</View>
									))}
								</View>
							)}

							{section.subSections && section.subSections.map((sub, sIdx) => (
								<View key={sIdx} className="mt-3 mb-2 ml-2">
									<Text className="font-UbuntuSans text-base text-black font-medium mb-1">
										{sub.title}
									</Text>
									{sub.content && (
										<Text className="font-Inter text-sm text-[#4B5563] leading-6 mb-2">
											{sub.content}
										</Text>
									)}
									{sub.bullets && (
										<View className="mt-1">
											{sub.bullets.map((bullet, idx) => (
												<View key={idx} className="flex-row mb-2 pr-2">
													<Text className="text-[#4B5563] mr-2 text-sm leading-6">-</Text>
													<Text className="font-Inter text-sm text-[#4B5563] leading-6 flex-1">
														{bullet}
													</Text>
												</View>
											))}
										</View>
									)}
								</View>
							))}

							{section.footer && (
								<Text className="font-Inter text-sm text-[#4B5563] leading-6 mt-2">
									{section.footer}
								</Text>
							)}
						</View>
					))}
				</View>

				<View className="mt-10 mb-8 w-full">
					<Pressable
						onPress={() => router.back()}
						className="bg-primary rounded-lg py-4 w-full items-center justify-center flex-row"
					>
						<Text className="text-white font-UbuntuSans font-semibold text-base">
							Return to Terms
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
