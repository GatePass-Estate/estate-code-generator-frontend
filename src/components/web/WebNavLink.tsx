type WebNavLinkProps = {
	onPress?: () => void;
	children: React.ReactNode;
	color?: string;
};

export default function WebNavLink({ onPress, children, color }: WebNavLinkProps) {
	return (
		<span onClick={onPress} className={`text-base ${color ? `text-${color}` : ''}`}>
			{children}
		</span>
	);
}
