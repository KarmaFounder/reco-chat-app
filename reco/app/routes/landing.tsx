import React from 'react';
import { Link } from 'react-router';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Reco</span>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/support" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Support
            </Link>
            <Link to="/privacy" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <a
              href="https://apps.shopify.com/reco-chat"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              Install App
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8 border border-gray-200">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">AI-Powered Shopping Assistant</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Reviews into<br />
            <span className="underline decoration-4 underline-offset-8">
              Revenue
            </span> with Reco
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            The AI Shopping Assistant that knows your products better than you do.
            Instantly answer customer questions using real reviews.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.shopify.com/reco-chat"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-black text-white rounded-full text-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Install on Shopify
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <Link
              to="/chat"
              className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              Try Demo
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-gray-700">4.9/5</span>
              <span>from 200+ stores</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
            <div>
              <span className="font-medium text-gray-700">Free trial</span> available
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Merchants Love Reco
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your customer experience with AI that actually understands your products
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Answers</h3>
              <p className="text-gray-600 leading-relaxed">
                No more searching through reviews. Reco answers fit, fabric, and styling questions instantly—right when customers need them most.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Review-Powered</h3>
              <p className="text-gray-600 leading-relaxed">
                Grounded 100% in your actual customer feedback. No hallucinations, just authentic insights from people who've purchased your products.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Fits perfectly into your Shopify theme. Enable the app embed in seconds—no coding required, no theme conflicts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-black rounded-3xl p-12 md:p-16 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to boost conversions?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of Shopify stores using Reco to turn browsers into buyers
            </p>
            <a
              href="https://apps.shopify.com/reco-chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Install on Shopify
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <p className="text-sm text-gray-400 mt-6">
              Free trial • No credit card required • Setup in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">R</span>
              </div>
              <span className="text-white font-semibold">Reco</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="mailto:support@askreco.com" className="hover:text-white transition-colors">
                support@askreco.com
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2025 Reco. Built by Michael & Nakai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
