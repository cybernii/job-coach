// PricingTable.tsx — shown to users without an active Premium subscription
// Replace the contents of this component with Clerk's <PricingTable /> once
// you have configured your subscription plan in the Clerk Dashboard.

export default function PricingTable() {
    return (
        <div className="w-full max-w-md mx-auto">
            {/* Replace this div with <PricingTable /> from @clerk/nextjs once Clerk subscription is configured */}
            <div className="border-2 border-blue-500 rounded-2xl p-8 bg-white shadow-lg text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Plan</h3>
                <p className="text-4xl font-bold text-blue-600 mb-1">$9<span className="text-base font-normal text-gray-400">/month</span></p>
                <p className="text-gray-500 text-sm mb-6">Unlimited AI job application analyses</p>
                <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                    <li>✓ Tailored resume bullets</li>
                    <li>✓ Ready-to-send cover letter</li>
                    <li>✓ Interview preparation tips</li>
                    <li>✓ Unlimited submissions</li>
                </ul>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                    Subscribe Now
                </button>
            </div>
        </div>
    );
}
