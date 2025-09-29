import { Image } from 'react-native';
import CountdownRing from '../common/CountdownRing';
import icons from '@/src/constants/icons';

type CodeCardProps = {
	code: string;
	details: {
		name: string;
		address: string;
		date: string;
		timeframe: string;
	};
	variant?: 'default' | 'warning' | 'success';
};

const variantStyles = {
	default: {
		container: 'bg-light-grey border-grey',
		text: 'text-grey',
		action: 'bg-grey',
	},
	warning: {
		container: 'bg-light-orange border-orange',
		text: 'text-orange',
		action: 'bg-orange',
	},
	success: {
		container: 'bg-light-teal border-teal',
		text: 'text-teal',
		action: 'bg-teal',
	},
};

const CodeCard = ({ code, details, variant = 'default' }: CodeCardProps) => {
	const styles = variantStyles[variant];

	return (
		<div className="flex relative ">
			<div className={`border p-7 rounded-lg flex flex-col gap-4 z-10 ${styles.container} ${styles.text}`}>
				<div className="flex justify-between items-center">
					<div>
						<h3 className="uppercase text-xs">access code</h3>
						<p className="text-4xl font-bold tracking-[0.25em] mt-2">{code}</p>
					</div>

					<div>
						<CountdownRing size={55} storageKey={`guest-${details?.name}`} />
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="web-access-code-details">
						<span className="web-access-code-details-heading">Name:</span>
						<span className="web-access-code-details-content">{details?.name}</span>
					</div>
					<div className="web-access-code-details">
						<span className="web-access-code-details-heading">Address:</span>
						<span className="web-access-code-details-content text-right">{details?.address}</span>
					</div>
					<div className="web-access-code-details">
						<span className="web-access-code-details-heading">Date:</span>
						<span className="web-access-code-details-content">{details?.date}</span>
					</div>
					<div className="web-access-code-details">
						<span className="web-access-code-details-heading">Timeframe:</span>
						<span className="web-access-code-details-content">{details?.timeframe}</span>
					</div>
				</div>
			</div>

			<div className={`${styles.action} relative -left-8 pl-10 p-2 rounded-xl gap-5 flex flex-col h-fit`}>
				<Image source={icons.deleteIcon} resizeMode="contain" style={{ width: 20, height: 20 }} className="cursor-pointer" />

				<Image source={icons.shareIcon} className="cursor-pointer" />
			</div>
		</div>
	);
};

export default CodeCard;
