import { ReactNode } from 'react';
import { router, usePathname } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image, ScrollView } from 'react-native';
import icons from '@/src/constants/icons';
import images from '@/src/constants/images';
import { RoundedButton } from './HomeComponents';

/* ------------------------------------------------------------------ */
/*  Brand palette                                                       */
/* ------------------------------------------------------------------ */
export const LP = {
	dark: '#04162D',
	darkLighter: '#0F1D32',
	accent: '#CEE5ED',
	accentSoft: 'rgba(0, 180, 216, 0.15)',
	accentBorder: 'rgba(0, 180, 216, 0.30)',
	white: '#FFFFFF',
	muted: '#9CA3AF',
	body: '#F8FAFC',
	cardBg: 'rgba(255, 255, 255, 0.03)',
	cardBorder: 'rgba(255, 255, 255, 0.06)',
} as const;

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */
const Navbar = () => {
	const pathname = usePathname();
	const links = [
		{ label: 'Home', path: '/' },
		{ label: 'About', path: '/about' },
		{ label: 'Contact', path: '/contact' },
	];

	return (
		<nav className="w-full z-50 relative" style={{ background: LP.dark }}>
			<div className="max-w-7xl mx-auto px-6 md:px-12 py-2 md:py-4 flex items-center justify-between">
				<button onClick={() => router.push('/')}>
					<Image source={images.gatepassWhiteLogo} style={{ width: 180, height: 60, resizeMode: 'contain' }} className="-ml-6 cursor-pointer" />
				</button>

				<div className="hidden md:flex items-center gap-8">
					{links.map((link) => {
						const isActive = pathname === link.path;
						return (
							<button key={link.path} onClick={() => router.push(link.path)} className={`font-inter-medium text-sm transition-colors relative pb-1 ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}>
								{link.label}
								{isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: LP.accent }} />}
							</button>
						);
					})}
				</div>

				<RoundedButton className="hidden md:flex" onPress={() => router.push('/auth/login')} icon={icons.rightLink}>
					Go to App
				</RoundedButton>
			</div>
		</nav>
	);
};

/* ------------------------------------------------------------------ */
/*  Footer                                                              */
/* ------------------------------------------------------------------ */
const Footer = () => {
	return (
		<footer className="w-full py-12" style={{ background: LP.dark }}>
			<div className="max-w-[90rem] mx-auto px-6 md:px-12">
				{/* Top row: Logo + nav */}
				<div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-10">
					<button onClick={() => router.push('/')}>
						<Image source={images.gatepassWhiteLogo} style={{ width: 250, height: 130, resizeMode: 'contain' }} className="cursor-pointer" />
					</button>

					{/* Desktop nav links inline */}
					<div className="hidden md:flex flex-wrap justify-center gap-x-8 gap-y-3">
						{[
							{ label: 'Home', path: '/' },
							{ label: 'About Us', path: '/about' },
							{ label: 'Contact', path: '/contact' },
						].map((l) => (
							<button key={l.path} onClick={() => router.push(l.path)} className="text-white hover:text-white text-sm font-inter-medium transition-colors">
								{l.label}
							</button>
						))}
					</div>

					{/* Mobile nav links in 2 columns */}
					<div className="flex md:hidden w-full justify-center gap-8">
						<div className="flex flex-col gap-3 text-left">
							<button onClick={() => router.push('/')} className="text-white text-sm font-inter-medium transition-colors text-left">
								Home
							</button>
							<button onClick={() => router.push('/about')} className="text-white text-sm font-inter-medium transition-colors text-left">
								About Us
							</button>
							<button onClick={() => router.push('/contact')} className="text-white text-sm font-inter-medium transition-colors text-left">
								Contact
							</button>
						</div>
						<div className="flex flex-col gap-3 text-left">
							<button onClick={() => router.push('/terms')} className="text-white text-sm font-inter-medium transition-colors text-left">
								Terms of Use
							</button>
							<button onClick={() => router.push('/privacy')} className="text-white text-sm font-inter-medium transition-colors text-left">
								Privacy Policy
							</button>
							<button onClick={() => router.push('/')} className="text-white text-sm font-inter-medium transition-colors text-left">
								Download APP
							</button>
						</div>
					</div>
				</div>

				{/* Bottom row: copyright + legal + social */}
				<div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: `1px solid ${LP.white}` }}>
					<p className="text-white text-sm font-inter-regular">© 2026 GatePass. All rights reserved.</p>

					<div className="hidden md:flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
						<button onClick={() => router.push('/terms')} className="text-white hover:text-white text-sm font-inter-medium transition-colors">
							Terms of Use
						</button>
						<button onClick={() => router.push('/privacy')} className="text-white hover:text-white text-sm font-inter-medium transition-colors">
							Privacy Policy
						</button>
						<button onClick={() => router.push('/')} className="text-white hover:text-white text-sm font-inter-medium transition-colors">
							Download APP
						</button>
						<div className="flex items-center gap-3 ml-2">
							{[
								{ icon: icons.linkedIn, label: 'LinkedIn' },
								{ icon: icons.emailIcon, label: 'Email' },
								{ icon: icons.xIcon, label: 'Twitter' },
								{ icon: icons.instagram, label: 'Instagram' },
							].map((s) => (
								<button key={s.label} className="w-9 h-9 rounded-full flex items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all">
									<Image source={s.icon} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
								</button>
							))}
						</div>
					</div>

					{/* Mobile: social icons and copyright centered */}
					<div className="flex md:hidden flex-col items-center gap-4">
						<div className="flex items-center gap-3">
							{[
								{ icon: icons.linkedIn, label: 'LinkedIn' },
								{ icon: icons.emailIcon, label: 'Email' },
								{ icon: icons.xIcon, label: 'Twitter' },
								{ icon: icons.instagram, label: 'Instagram' },
							].map((s) => (
								<button key={s.label} className="w-9 h-9 rounded-full flex items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all">
									<Image source={s.icon} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
								</button>
							))}
						</div>
						<p className="text-white text-xs font-inter-regular">© 2026 GatePass. All rights reserved.</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

/* ------------------------------------------------------------------ */
/*  Layout wrapper                                                      */
/* ------------------------------------------------------------------ */
export default function LandingLayout({ children }: { children: ReactNode }) {
	return (
		<ScrollView className="w-full min-h-screen flex flex-col" contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: LP.dark }}>
			<Navbar />
			<main className="flex-1">{children}</main>
			<Footer />
		</ScrollView>
	);
}
