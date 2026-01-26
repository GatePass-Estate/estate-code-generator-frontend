const Modal = ({
	closeModal,
	action,
	btnDisabled,
	message,
	heading,
	cancelText,
	actionText,
	runningText,
	actionRunnig,
	actionBtnClassName,
}: {
	closeModal: () => void;
	action?: () => void;
	btnDisabled?: boolean;
	message: string;
	heading: string;
	cancelText: string;
	actionText?: string;
	actionRunnig?: boolean;
	runningText?: string;
	actionBtnClassName?: string;
}) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-primary opacity-80" onClick={closeModal} />
			<div className="bg-white rounded-lg p-6 z-10 w-[320px]">
				<h4 className="text-lg font-semibold mb-2">{heading}</h4>
				<p className="mb-4">{message}</p>
				<div className="flex justify-end gap-3">
					<button className="px-4 py-2 bg-gray-200 rounded" onClick={closeModal} disabled={btnDisabled}>
						{cancelText}
					</button>

					{action && (
						<button className={`px-4 py-2 text-white rounded ${actionBtnClassName ? actionBtnClassName : 'bg-red-600'}`} onClick={action} disabled={btnDisabled}>
							{actionRunnig ? runningText : actionText}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Modal;
