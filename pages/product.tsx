"use client"

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useAuth, UserButton, Protect } from '@clerk/nextjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import PricingTable from '../components/PricingTable';

type SectionKey = 'bullets' | 'cover' | 'interview';

const TABS: { key: SectionKey; label: string; icon: string; heading: string }[] = [
    { key: 'bullets',   label: 'Resume Bullets', icon: '📄', heading: 'Tailored Resume Bullets' },
    { key: 'cover',     label: 'Cover Letter',   icon: '✉️',  heading: 'Cover Letter Draft' },
    { key: 'interview', label: 'Interview Tips', icon: '🎯', heading: 'Interview Preparation Tips' },
];

function parseSection(output: string, heading: string): string {
    const pattern = new RegExp(`## ${heading}([\\s\\S]*?)(?=## |$)`, 'i');
    const match = output.match(pattern);
    return match ? match[1].trim() : '';
}

export default function Product() {
    const { getToken } = useAuth();

    const [jobTitle, setJobTitle]             = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [resumeText, setResumeText]         = useState('');
    const [experienceLevel, setExperienceLevel] = useState('Mid');
    const [targetCompany, setTargetCompany]   = useState('');

    const [output, setOutput]     = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]       = useState('');
    const [activeTab, setActiveTab] = useState<SectionKey>('bullets');
    const [copied, setCopied]     = useState<SectionKey | null>(null);

    const sections = useMemo(() => ({
        bullets:   parseSection(output, 'Tailored Resume Bullets'),
        cover:     parseSection(output, 'Cover Letter Draft'),
        interview: parseSection(output, 'Interview Preparation Tips'),
    }), [output]);

    const handleCopy = async (key: SectionKey, content: string) => {
        await navigator.clipboard.writeText(content);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setOutput('');
        setError('');
        setIsLoading(true);
        setActiveTab('bullets');

        try {
            const jwt = await getToken();
            if (!jwt) {
                setError('Authentication error. Please sign in again.');
                setIsLoading(false);
                return;
            }

            let buffer = '';

            const apiUrl = process.env.NEXT_PUBLIC_API_URL
                ? `${process.env.NEXT_PUBLIC_API_URL}/api`
                : '/api';

            await fetchEventSource(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    job_title:        jobTitle,
                    job_description:  jobDescription,
                    resume_text:      resumeText,
                    experience_level: experienceLevel,
                    target_company:   targetCompany,
                }),
                async onopen(response) {
                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
                    }
                },
                onmessage(ev) {
                    buffer += ev.data;
                    setOutput(buffer);
                    // Auto-follow the section being generated
                    if (buffer.includes('## Interview Preparation Tips')) {
                        setActiveTab('interview');
                    } else if (buffer.includes('## Cover Letter Draft')) {
                        setActiveTab('cover');
                    }
                },
                onerror(err) {
                    console.error('SSE error:', err);
                    setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
                    setIsLoading(false);
                    throw err;
                },
                onclose() {
                    setIsLoading(false);
                    setActiveTab('bullets'); // Jump back to first tab when done
                },
            });
        } catch {
            setIsLoading(false);
        }
    };

    const activeContent = sections[activeTab];

    return (
        <Protect
            plan="premium_subscription"
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Unlock Your Career Advantage</h2>
                    <p className="text-gray-500 mb-8 text-center max-w-md">
                        Subscribe to Premium to access the AI Job Application Coach and land your next role faster.
                    </p>
                    <PricingTable />
                </div>
            }
        >
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                {/* Top nav */}
                <div className="flex justify-end items-center px-6 py-4">
                    <UserButton showName={true} />
                </div>

                <div className="container mx-auto px-4 pb-16 max-w-5xl">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            Job Application Coach
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Paste the job description and your resume — get tailored bullets, a cover letter, and interview tips instantly.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* ── Input form ── */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Your Details</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Job Title <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={e => setJobTitle(e.target.value)}
                                        placeholder="e.g. Senior Software Engineer"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Target Company <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={targetCompany}
                                        onChange={e => setTargetCompany(e.target.value)}
                                        placeholder="e.g. Shopify"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Experience Level <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={experienceLevel}
                                        onChange={e => setExperienceLevel(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="Entry">Entry Level</option>
                                        <option value="Mid">Mid Level</option>
                                        <option value="Senior">Senior Level</option>
                                        <option value="Executive">Executive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Job Description <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={jobDescription}
                                        onChange={e => setJobDescription(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        required
                                        rows={6}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Your Resume / CV <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={resumeText}
                                        onChange={e => setResumeText(e.target.value)}
                                        placeholder="Paste your resume text here..."
                                        required
                                        rows={6}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-y"
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                                >
                                    {isLoading ? 'Analysing…' : 'Generate Application Materials →'}
                                </button>
                            </form>
                        </div>

                        {/* ── Results panel ── */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">

                            {/* Tab bar */}
                            <div className="flex border-b border-gray-100 dark:border-gray-700">
                                {TABS.map(({ key, label, icon }) => {
                                    const hasContent = sections[key].length > 0;
                                    const isActive   = activeTab === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            disabled={!hasContent}
                                            className={[
                                                'flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors',
                                                isActive
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : hasContent
                                                        ? 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
                                                        : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed',
                                            ].join(' ')}
                                        >
                                            <span>{icon}</span>
                                            <span className="hidden sm:inline">{label}</span>
                                            {/* Pulsing dot while this section is still streaming in */}
                                            {isLoading && !hasContent && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab content */}
                            <div className="p-6 overflow-auto" style={{ minHeight: '24rem' }}>

                                {/* Empty state */}
                                {!output && !isLoading && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-300 dark:text-gray-600 text-sm text-center gap-3">
                                        <span className="text-5xl">✨</span>
                                        <span>Your tailored resume bullets, cover letter, and interview tips will appear here.</span>
                                    </div>
                                )}

                                {/* Spinner while waiting for first tokens on this tab */}
                                {isLoading && !activeContent && (
                                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-blue-400 text-sm">
                                            Generating {TABS.find(t => t.key === activeTab)?.label.toLowerCase()}…
                                        </p>
                                    </div>
                                )}

                                {/* Section content */}
                                {activeContent && (
                                    <div className="relative">
                                        {/* Copy button */}
                                        <button
                                            onClick={() => handleCopy(activeTab, activeContent)}
                                            className="absolute top-0 right-0 text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            {copied === activeTab ? '✓ Copied!' : '📋 Copy'}
                                        </button>

                                        {/* Rendered markdown */}
                                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300
                                            prose-headings:text-gray-800 dark:prose-headings:text-gray-100
                                            prose-strong:text-gray-800 dark:prose-strong:text-gray-100
                                            prose-li:my-1 prose-ul:my-2 prose-ol:my-2
                                            pt-1 pr-16">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {activeContent}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Protect>
    );
}
