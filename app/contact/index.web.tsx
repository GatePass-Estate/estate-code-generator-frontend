import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import LandingLayout, { LP } from '@/src/components/web/LandingLayout';

/* ------------------------------------------------------------------ */
/*  Reusable input                                                       */
/* ------------------------------------------------------------------ */
const Input = ({ placeholder, value, onChange, type = 'text', className = '' }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) => (
	<input
		type={type}
		value={value}
		onChange={(e) => onChange(e.target.value)}
		placeholder={placeholder}
		className={`w-full bg-transparent text-white placeholder-gray-500 text-sm font-inter-regular outline-none px-5 py-4 rounded-xl transition-all focus:ring-1 ${className}`}
		style={{
			background: LP.cardBg,
			border: `1px solid ${LP.accent}`,
			boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
		}}
		onFocus={(e) => {
			e.currentTarget.style.borderColor = LP.accentBorder;
			e.currentTarget.style.boxShadow = `0 0 0 3px ${LP.accentSoft}`;
		}}
		onBlur={(e) => {
			e.currentTarget.style.borderColor = LP.accent;
			e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
		}}
	/>
);

const TextArea = ({ placeholder, value, onChange, className = '', rows = 6 }: { placeholder: string; value: string; onChange: (v: string) => void; className?: string; rows?: number }) => (
	<textarea
		value={value}
		onChange={(e) => onChange(e.target.value)}
		placeholder={placeholder}
		rows={rows}
		className={`w-full bg-transparent text-white placeholder-gray-500 text-sm font-inter-regular outline-none px-5 py-4 rounded-xl transition-all resize-none ${className}`}
		style={{
			background: LP.cardBg,
			border: `1px solid ${LP.accent}`,
			boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
		}}
		onFocus={(e) => {
			e.currentTarget.style.borderColor = LP.accentBorder;
			e.currentTarget.style.boxShadow = `0 0 0 3px ${LP.accentSoft}`;
		}}
		onBlur={(e) => {
			e.currentTarget.style.borderColor = LP.accent;
			e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
		}}
	/>
);

/* ------------------------------------------------------------------ */
/*  Main page                                                             */
/* ------------------------------------------------------------------ */
const ContactPage = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Contact Us — GatePass';
	}, []);

	return (
		<LandingLayout>
			<div className="max-w-3xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20 md:pb-28 text-center">
				<h1 className="text-4xl md:text-8xl font-inter-regular text-white mb-8">Contact Us</h1>

				<div className="mb-8">
					<p className="text-white font-inter-light text-base">
						Email: info@gatepassng.com
						<br />
						Phone: 212-457-4014
					</p>
				</div>

				<p className="text-white font-inter-light text-base mb-12 max-w-xl mx-auto">Email us first or complete the form below for the fastest response. We&apos;re here to help, no matter how you reach out!</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						alert('Thank you for reaching out! We will get back to you soon.');
						setName('');
						setEmail('');
						setMessage('');
					}}
					className="text-left space-y-5"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<Input placeholder="Name" value={name} onChange={setName} />
						<Input placeholder="Email Address" value={email} onChange={setEmail} type="email" />
					</div>
					<TextArea placeholder="Your message ..." value={message} onChange={setMessage} rows={8} />

					<div className="flex justify-end">
						<button type="submit" className="rounded-xl px-8 py-2 font-inter-medium border transition-all  flex items-center gap-1 bg-accent hover:bg-white/5 text-primary hover:text-white  hover:border-white">
							Send Message
						</button>
					</div>
				</form>
			</div>
		</LandingLayout>
	);
};

export default ContactPage;
