import { useEffect } from 'react';
import { Platform } from 'react-native';
import LandingLayout, { LP } from '@/src/components/web/LandingLayout';

/* ------------------------------------------------------------------ */
/*  Content sections                                                      */
/* ------------------------------------------------------------------ */
const sections = [
	{
		content: 'Welcome to Gatepass. By creating an account or using the Gatepass Application ("App"), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.',
	},
	{
		title: 'Acceptance of Terms',
		content:
			'By accessing or using Gatepass, you confirm that you have read, understood, and agreed to these Terms and Conditions. If you do not agree, please do not use the App.\n\nBy accessing or using Gatepass, you confirm that you have read, understood, and agreed to these Terms and Conditions. If you do not agree, please do not use the App.',
	},
	{
		content:
			'Gatepass is a digital access and visitor management platform that enables users to request, receive, and manage entry permissions within supported locations or facilities.\n\nThe App helps facilitate secure movement and access but does not guarantee entry approval, which remains subject to administrator authorization.',
	},
	{
		content: 'To use certain features, you may be required to create an account. You agree to:',
		bullets: ['Provide accurate and up-to-date information.', 'Keep your login credentials secure.', 'Be responsible for all activities under your account.rity risks to facilities or users.'],
	},
];

/* ------------------------------------------------------------------ */
/*  Main page                                                             */
/* ------------------------------------------------------------------ */
const PrivacyPage = () => {
	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Privacy Policy — GatePass';
	}, []);

	return (
		<LandingLayout>
			<div className="max-w-3xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20 md:pb-28">
				<h1 className="text-4xl md:text-8xl font-inter-regular text-white mb-3">Privacy Policy</h1>
				<p className="text-white text-base font-ubuntu-semibold mb-12">Last Updated: 16th December 2023.</p>

				<div className="space-y-2">
					{sections.map((section, i) => (
						<div key={i}>
							<h2 className="text-xl font-ubuntu-semibold text-white mb-3">{section.title}</h2>
							{section.content.split('\n\n').map((paragraph, pIdx) => (
								<p key={pIdx} className="text-white text-base leading-relaxed mb-3 font-ubuntu-regular">
									{paragraph}
								</p>
							))}
							{section.bullets && (
								<ul className="mt-3 space-y-2">
									{section.bullets.map((bullet, bIdx) => (
										<li key={bIdx} className="flex items-start gap-3">
											<span className="w-1 h-1 rounded-full mt-2.5 shrink-0" style={{ background: LP.accent }} />
											<span className="text-white text-base leading-relaxed font-ubuntu-regular">{bullet}</span>
										</li>
									))}
								</ul>
							)}
						</div>
					))}
				</div>
			</div>
		</LandingLayout>
	);
};

export default PrivacyPage;
