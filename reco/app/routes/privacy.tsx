import React from 'react';
import { Link } from 'react-router';

export default function PrivacyPolicy() {
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

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-gray-600 mb-12">Last updated: December 15, 2025</p>

                <div className="prose prose-lg max-w-none">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Reco ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our AI-powered shopping assistant application for Shopify stores.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            By installing and using Reco, you agree to the collection and use of information in accordance with this policy.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Store Product Data</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We collect and process the following information from your Shopify store:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                            <li>Product names, descriptions, and metadata</li>
                            <li>Public customer reviews and ratings</li>
                            <li>Product images and variant information</li>
                        </ul>
                        <p className="text-gray-700 leading-relaxed">
                            This data is used solely to power the AI chat assistant and provide accurate, review-based responses to customer questions.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Customer Interactions</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            When shoppers interact with the Reco assistant, we collect:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                            <li>Questions asked to the AI assistant</li>
                            <li>Session identifiers (to maintain conversation context)</li>
                            <li>Anonymous usage analytics (feature usage, response times)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Information We Do NOT Collect</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We want to be clear about what we do not collect:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Customer personal identifiable information (PII)</li>
                            <li>Payment or credit card information</li>
                            <li>Customer email addresses or contact details</li>
                            <li>Order or purchase history</li>
                            <li>Any data beyond public reviews and product information</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            The information we collect is used exclusively for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li><strong>Provide AI Chat Responses:</strong> To answer customer questions about your products using review data</li>
                            <li><strong>Improve Service Quality:</strong> To enhance the accuracy and relevance of AI responses</li>
                            <li><strong>Maintain Conversation Context:</strong> To enable coherent multi-turn conversations</li>
                            <li><strong>Analytics:</strong> To provide you with insights on common customer questions and app performance</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Reco uses the following third-party services to provide our AI functionality:
                        </p>

                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Gemini API</h3>
                            <p className="text-gray-700 leading-relaxed mb-2">
                                We use Google's Gemini large language model (LLM) to process customer questions and generate responses based on review data.
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                Review data and customer questions are sent to Google's API for processing. Google's use of this data is governed by their own privacy policy and terms of service. We do not send any sensitive customer information to Google.
                            </p>
                        </div>

                        <p className="text-gray-700 leading-relaxed">
                            We carefully select third-party services that maintain high standards of data security and privacy.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>All data transmission is encrypted using HTTPS/TLS</li>
                            <li>Database access is restricted and authenticated</li>
                            <li>Regular security audits and updates</li>
                            <li>Minimal data retention (conversations are stored temporarily for context)</li>
                        </ul>
                        <p className="text-gray-700 leading-relaxed mt-4">
                            While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to protecting your data to the best of our ability.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            If you have any questions about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-gray-100 rounded-lg p-6">
                            <p className="text-gray-900 font-medium mb-2">Reco Support</p>
                            <p className="text-gray-700 mb-1">
                                Email: <a href="mailto:support@askreco.com" className="text-black hover:text-gray-700 font-medium underline">support@askreco.com</a>
                            </p>
                            <p className="text-gray-700">
                                We aim to respond to all inquiries within 48 hours.
                            </p>
                        </div>
                    </section>
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
