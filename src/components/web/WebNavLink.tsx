type WebNavLinkProps = {
	onPress?: () => void;
	children: React.ReactNode;
};

export default function WebNavLink({ onPress, children }: WebNavLinkProps) {
	return <span onClick={onPress}>{children}</span>;
}
