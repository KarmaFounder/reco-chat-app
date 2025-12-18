import React, { useState } from 'react';
import { Link } from 'react-router';

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I install Reco?",
            answer: "Installing Reco is simple! After installing from the Shopify App Store, go to your Theme Editor (Online Store > Themes > Customize). Click on 'App embeds' in the left sidebar, find Reco, and toggle it on. Save your changes, and Reco will appear on your product pages. No coding required!"
        },
        {
            question: "Does it work with my theme?",
            answer: "Yes! Reco is theme-agnostic and works with all Shopify themes. It's built as an app embed that seamlessly integrates into your existing theme without any conflicts. Whether you're using a free Shopify theme or a premium third-party theme, Reco will fit right in."
        },
        {
            question: "How much does it cost?",
            answer: "We offer a free 14-day trial so you can test Reco risk-free. After the trial, plans start at $50/month for up to 1,000 conversations. We offer tiered pricing based on your store's needs. For high-volume stores, please contact us for custom enterprise pricing."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Reco</span>
                    </Link>
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-black text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">How can we help?</h1>
                    <p className="text-xl text-gray-300">
                        Get answers to common questions or reach out to our support team
                    </p>
                </div>
            </div>

            {/* Contact Section */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Support</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Our team is here to help you get the most out of Reco
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                                    <a
                                        href="mailto:support@askreco.com"
                                        className="text-black hover:text-gray-700 font-medium underline"
                                    >
                                        support@askreco.com
                                    </a>
                                    <p className="text-sm text-gray-600 mt-1">We typically respond within 24 hours</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                                    <p className="text-gray-700 font-medium">24-48 hours</p>
                                    <p className="text-sm text-gray-600 mt-1">Monday - Friday, 9am - 6pm EST</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Need urgent help?</h4>
                                <p className="text-sm text-gray-700">
                                    For urgent technical issues affecting your store, please include "[URGENT]" in your email subject line, and we'll prioritize your request.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                                    <svg
                                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {openFaq === index && (
                                    <div className="px-6 pb-5 pt-0">
                                        <div className="pt-4 border-t border-gray-100">
                                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Resources */}
                <div className="mt-16 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Step-by-step guides for setup, customization, and best practices
                        </p>
                        <Link to="/" className="text-black hover:text-gray-700 font-medium text-sm underline">
                            Coming soon →
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Watch video walkthroughs to get started quickly with Reco
                        </p>
                        <Link to="/" className="text-black hover:text-gray-700 font-medium text-sm underline">
                            Coming soon →
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Join other merchants using Reco to share tips and insights
                        </p>
                        <Link to="/" className="text-black hover:text-gray-700 font-medium text-sm underline">
                            Coming soon →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
                    <p>© 2025 Reco. Built by Michael & Nakai. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
