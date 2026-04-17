"use client"

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">

        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">JobCoach AI</h1>
          </div>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link
                  href="/product"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Open App
                </Link>
                <UserButton showName={true} afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center py-20">
          <div className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-6">
            AI-Powered Career Acceleration
          </div>
          <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Land the Job.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Skip the Guesswork.
            </span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Paste any job description and your resume. Get tailored resume bullets, a ready-to-send cover letter,
            and interview tips — in under 30 seconds.
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg">
                Try It Free →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/product">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg">
                Open App →
              </button>
            </Link>
          </SignedIn>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">ATS-Optimised Bullets</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Get 5–8 achievement-focused bullet points that mirror the exact keywords hiring managers and ATS scanners look for.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Cover Letter, Ready to Send</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              A personalised, professional cover letter tailored to the specific company and role — not a generic template.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Interview Prep Included</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Predict the exact questions you will face and practise answers with STAR-method guidance before the call.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center py-16 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Simple Pricing</h3>
          <p className="text-gray-500 mb-10">No usage limits. Cancel any time.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Free</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$0</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 text-left">
                <li>✓ Create an account</li>
                <li>✓ View the app demo</li>
                <li>✗ AI analysis (Premium only)</li>
              </ul>
            </div>
            <div className="border-2 border-blue-500 rounded-2xl p-6 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900 dark:to-gray-800 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Premium</h4>
              <p className="text-3xl font-bold text-blue-600 mb-4">$9<span className="text-base font-normal text-gray-400">/mo</span></p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left">
                <li>✓ Unlimited AI analyses</li>
                <li>✓ Tailored resume bullets</li>
                <li>✓ Cover letter drafts</li>
                <li>✓ Interview prep tips</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
