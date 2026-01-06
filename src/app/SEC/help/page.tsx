'use client';

import SECHeader from '../SECHeader';
import SECFooter from '../SECFooter';

export default function HelpPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            <SECHeader />
            <main className="flex-1 p-4">
                <h1 className="text-xl font-extrabold mb-4 text-black">Help & Support</h1>
                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                    <p className="text-gray-800 font-bold">
                        Welcome to the Help Center. Here you can find assistance and resources.
                    </p>
                    <div className="border-t border-gray-200 pt-4">
                        <h2 className="text-lg font-bold mb-2 text-black">Contact Support</h2>
                        <p className="text-sm text-gray-700 font-bold">Need help? Reach out to our support team.</p>
                    </div>
                </div>
            </main>
            <SECFooter />
        </div>
    );
}
