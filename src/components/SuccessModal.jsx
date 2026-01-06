'use client';

export default function SuccessModal({
    isOpen,
    earnedIncentive,
    onClose
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in duration-300"
            >
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                    <p className="text-gray-600">You've successfully submitted the sale.</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Total Incentive Earned</p>
                    <p className="text-3xl font-bold text-green-600">₹{earnedIncentive}</p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                    View My Report
                </button>
            </div>
        </div>
    );
}
