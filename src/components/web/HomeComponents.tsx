/* ------------------------------------------------------------------ */
/*  Reusable helpers                                                   */

import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';

/* ------------------------------------------------------------------ */
export const Section = ({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
	<div className={`w-full ${className}`} style={style}>
		<div className="max-w-[90rem] mx-auto px-6 md:px-12 h-full">{children}</div>
	</div>
);

export const PillButton = ({ children, variant = 'primary', onPress, className = '', icon }: { children: React.ReactNode; variant?: 'primary' | 'outline' | 'outlineDark'; onPress?: () => void; className?: string; icon?: React.ReactNode }) => {
	const base = 'inline-flex items-center gap-2 rounded-full px-6 py-3 font-ubuntu-medium text-sm transition-all duration-200 cursor-pointer';
	const styles = {
		primary: 'bg-white text-[#0A1628] hover:bg-gray-100',
		outline: 'border border-white/30 text-white hover:bg-white/10',
		outlineDark: 'border border-[#0A1628]/30 text-[#0A1628] hover:bg-[#0A1628]/5',
	};
	return (
		<button onClick={onPress} className={`${base} ${styles[variant]} ${className}`}>
			{children}
			{icon}
		</button>
	);
};

export const RoundedButton = ({ children, onPress, className = '', icon, iconWidth = 30, iconHeight = 30, fill = false }: { children: React.ReactNode; onPress?: () => void; className?: string; icon?: ImageSourcePropType; iconWidth?: number; iconHeight?: number; fill?: boolean }) => {
	const base = `rounded-2xl px-5 py-2 font-inter-medium border transition-all  flex items-center gap-1 ${fill ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-accent hover:bg-white/5 text-primary hover:text-white  hover:border-white'}`;
	return (
		<button onClick={onPress} className={`${base} ${className}`}>
			{children}

			{icon && <Image source={icon} style={{ width: iconWidth, height: iconHeight, resizeMode: 'contain', tintColor: fill ? '#FFFFFF' : undefined }} className="" />}
		</button>
	);
};

export const SectionHeading = ({ children, className = '', light = false }: { children: React.ReactNode; className?: string; light?: boolean }) => <h2 className={`text-3xl md:text-4xl font-inter-bold leading-tight ${light ? 'text-white' : 'text-[#0A1628]'} ${className}`}>{children}</h2>;

export const BodyText = ({ children, className = '', light = false }: { children: React.ReactNode; className?: string; light?: boolean }) => <p className={`text-base md:text-lg leading-relaxed ${light ? 'text-gray-300' : 'text-gray-600'} ${className}`}>{children}</p>;

/* ------------------------------------------------------------------ */
/*  Phone mockup                                                       */
/* ------------------------------------------------------------------ */
export const PhoneMockup = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`relative mx-auto ${className}`} style={{ width: 240, height: 480 }}>
		<div className="absolute inset-0 rounded-[36px] overflow-hidden shadow-2xl border-[6px] border-gray-800 bg-gray-900">
			{/* Notch */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-20" />
			{/* Screen */}
			<div className="w-full h-full bg-gray-50 pt-5 overflow-hidden">{children}</div>
		</div>
	</div>
);

/* ------------------------------------------------------------------ */
/*  Feature card (Why Choose Us)                                        */
/* ------------------------------------------------------------------ */
export const WhyCard = ({ icon, title, desc, className }: { icon: React.ReactNode; title: string; desc: string; className?: string }) => (
	<div className={`p-6 rounded-2xl border-[0.5px] transition-all duration-200 hover:-translate-y-1 relative overflow-hidden bg-[#FBFEFF]/3 border-accent hover:bg-[#FBFEFF]/5 ${className}`}>
		<div className="flex items-start gap-4 pointer-events-none">
			<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-tertiary">
				<span className="font-inter-semibold text-white">{icon}</span>
			</div>
			<div>
				<h4 className="text-white font-ubuntu-semibold text-lg mb-2">{title}</h4>
				<p className="text-white font-inter-light text-base leading-relaxed">{desc}</p>
			</div>
		</div>
	</div>
);
