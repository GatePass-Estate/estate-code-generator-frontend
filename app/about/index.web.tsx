import { useEffect } from 'react';
import { Image, Platform } from 'react-native';
import { router } from 'expo-router';
import LandingLayout, { LP } from '@/src/components/web/LandingLayout';
import { BodyText, Section, SectionHeading } from '@/src/components/web/HomeComponents';
import images from '@/src/constants/images';
import icons from '@/src/constants/icons';

/* ------------------------------------------------------------------ */
/*  Main page                                                             */
/* ------------------------------------------------------------------ */
const AboutPage = () => {
	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'About Us — GatePass';
	}, []);

	return (
		<LandingLayout>
			{/* Hero */}
			<Section className="pt-16 md:pt-24" style={{ background: LP.dark }}>
				<div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 pb-32 relative">
					<div className="flex-1">
						<SectionHeading className="mb-6 text-4xl md:text-7xl text-white font-inter-semibold text-center md:text-left">
							About <output className="font-inter-light">Us</output>
						</SectionHeading>
						<BodyText className="text-white font-ubuntu-light max-w-4xl text-center md:text-left">
							At GatePass, we believe that security should be an invisible, seamless part of your daily life—not a barrier to it. We are a next-generation security technology company dedicated to replacing the friction of manual "paper-log" security with a sophisticated, digital-first
							ecosystem designed for residential estates, corporate headquarters, and multi-tenant commercial properties.
						</BodyText>
					</div>
					<div className="flex justify-center absolute -bottom-16 md:bottom-0 md:right-0">
						<Image source={images.globeImage} alt="About Us" className="mix-blend-lighten" />
					</div>
				</div>
			</Section>

			{/* Architecture of Trusted Access */}
			<Section className="py-16 md:pt-30" style={{ background: LP.dark }}>
				<div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
					<Image source={images.shieldImage} alt="Architecture of Trusted Access" className="mix-blend-lighten flex-1 hidden md:block" />

					<div className="flex-1">
						<SectionHeading className="mb-4 font-inter-semibold text-4xl text-white">The Architecture of Trusted Access</SectionHeading>

						<div className="w-full h-20 overflow-hidden">
							<Image source={images.shieldImage} alt="Architecture of Trusted Access" className="mix-blend-lighten block md:hidden object-contain" />
						</div>

						<BodyText className="mb-3 text-base text-white font-ubuntu-light">
							In an era where security threats and data privacy are equally critical, GatePass offers a Zero-Trust Physical Security platform. We shift the paradigm from reactive gatekeeping to proactive verification, ensuring that every person crossing your perimeter is authorized by
							the only person who matters: You.
						</BodyText>
						<div className="space-y-2">
							{[
								'No more unexpected knocks. Hosts authorize guests before they arrive, creating a "red carpet" experience for friends and a digital firewall against intruders.',
								'Real-time push notifications and a permanent, encrypted audit trail mean you are never in the dark about who is in your community.',
								'Operational Intelligence: We use data to help facilities run better. Turning security logs into actionable insights.',
							].map((item, i) => (
								<div key={i} className="flex items-start gap-3">
									<span className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={{ background: LP.accent }} />
									<span className="text-white text-base md:text-lg leading-relaxed font-ubuntu-light">{item}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</Section>

			{/* The GatePass Way */}
			<Section className="py-16 md:py-24" style={{ background: LP.dark }}>
				<div className="flex justify-between items-center gap-20">
					<div className="">
						<SectionHeading className="text-white !text-xl font-inter-semibold">The GatePass Way</SectionHeading>
						<p className="text-white/70 text-base font-inter-light mx-auto text-start">
							Most security systems focus on the gate. We <br /> focus on the handshake.
						</p>
					</div>

					<div className="flex justify-between items-center gap-4 md:gap-6 flex-1">
						<div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#D9D9D9]/5">
							<Image source={icons.dbIcon} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
						</div>

						<div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#D9D9D9]/5">
							<Image source={icons.shieldIcon} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
						</div>

						<div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#D9D9D9]/5">
							<Image source={icons.powerIcon} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
						</div>

						<div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#D9D9D9]/5">
							<Image source={icons.aiIcon} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
						</div>
					</div>
				</div>
			</Section>

			{/* Our Goal */}
			<Section className="py-16 md:py-20" style={{ background: LP.dark }}>
				<div className="flex flex-col md:flex-row gap-8 md:gap-12">
					<div className="mt-5">
						<h3 className="mb-4 text-white !text-lg cursor-pointer  hover:text-white font-inter-medium">Our Goal</h3>
						<h3 className="mb-4 text-[#D3D3D3]/50 !text-lg cursor-pointer  hover:text-white font-inter-medium">How We Work</h3>
						<h3 className="mb-4 text-[#D3D3D3]/50 !text-lg cursor-pointer  hover:text-white font-inter-medium">Need to get started?</h3>
					</div>

					<div className="rounded-2xl overflow-hidden flex-1">
						<Image source={images.fingerImage} style={{ width: '100%', height: 300, resizeMode: 'cover' }} />
					</div>

					<div className="flex-1 mt-10">
						<BodyText className="text-white/80 font-ubuntu-light">
							We are committed to securing the future of real estate and corporate infrastructure. By integrating cutting-edge software with physical security protocols, we ensure that your space remains what it was always meant to be:{' '}
							<b className="italic">Secure, Private, and Welcoming.</b>
						</BodyText>
					</div>
				</div>
			</Section>

			{/* CTA */}
			<Section className="py-20 md:py-28 relative overflow-hidden">
				<div className="flex flex-col items-center relative z-10 text-center max-w-3xl mx-auto -mb-16">
					<SectionHeading className="mb-10 text-white font-inter-light text-3xl md:text-5xl">Join the future of access control and give your residents the peace of mind they deserve.</SectionHeading>
					<button type="submit" onClick={() => router.push('/contact')} className="rounded-xl px-4 py-2 font-inter-medium border transition-all  flex items-center gap-1 bg-accent hover:bg-white/5 text-primary hover:text-white  hover:border-white">
						Send Us A Message
					</button>
				</div>
				<div className="inset-0 opacity-40 h-96 -mb-52" style={{ background: LP.dark }}>
					<Image source={images.horizonImage} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} className="mix-blend-lighten" />
				</div>
			</Section>
		</LandingLayout>
	);
};

export default AboutPage;
