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
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
			<div className="absolute inset-0 bg-primary opacity-50 backdrop-blur-sm" onClick={closeModal} />
			<div className="bg-white rounded-2xl z-10 w-full min-w-0 max-w-lg max-h-[min(90vh,560px)] overflow-y-auto shadow-2xl border border-gray-100 p-5 sm:p-8">
				<h4 className="text-xl sm:text-2xl font-ubuntu-bold text-black mb-3">{heading}</h4>
				<p className="text-[#4B5563] font-inter-regular text-sm sm:text-base mb-6 sm:mb-8 leading-6">{message}</p>
				<div className="flex flex-row sm:justify-end gap-3 mt-4">
					<button
						className="w-full sm:w-auto px-6 py-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] transition rounded-lg text-black font-ubuntu-medium text-base"
						onClick={closeModal}
						disabled={btnDisabled}
					>
						{cancelText}
					</button>

					{action && (
						<button
							className={`w-full sm:w-auto px-6 py-3 text-white transition rounded-lg font-ubuntu-medium text-base ${actionBtnClassName ? actionBtnClassName : 'bg-red-600 hover:bg-red-700'}`}
							onClick={action}
							disabled={btnDisabled}
						>
							{actionRunnig ? runningText : actionText}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Modal;
