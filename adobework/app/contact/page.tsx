'use client';

import { useState } from 'react';
import Link from 'next/link';

// Note: Metadata must be in a separate file for client components
// See contact/layout.tsx for metadata

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate form submission
    // In production, this would send to an API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // For demo purposes, always show success
    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const supportTopics = [
    { value: '', label: 'Select a topic' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'bug', label: 'Report a Bug' },
    { value: 'business', label: 'Business Inquiry' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Have a question or feedback? We&apos;d love to hear from you. 
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
              
              {status === 'success' ? (
                <div className="mt-6 rounded-lg bg-green-50 p-6 text-center">
                  <div className="text-4xl">✅</div>
                  <h3 className="mt-4 text-lg font-semibold text-green-800">
                    Message Sent Successfully!
                  </h3>
                  <p className="mt-2 text-green-700">
                    Thank you for contacting us. We&apos;ll get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {supportTopics.map((topic) => (
                        <option key={topic.value} value={topic.value}>
                          {topic.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === 'submitting' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin\" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Support Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Support Information</h2>
                <p className="mt-4 text-gray-600">
                  We&apos;re here to help! Check out the resources below or send us a message.
                </p>
              </div>

              {/* FAQ Link */}
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-2xl">
                    ❓
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Frequently Asked Questions
                    </h3>
                    <p className="mt-1 text-gray-600">
                      Find quick answers to common questions about our PDF tools.
                    </p>
                    <Link
                      href="/#faq"
                      className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      View FAQs →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">
                    ⏱️
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
                    <p className="mt-1 text-gray-600">
                      We typically respond to all inquiries within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Contact */}
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                    ✉️
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email Us Directly</h3>
                    <p className="mt-1 text-gray-600">
                      You can also reach us directly via email:
                    </p>
                    <a
                      href="mailto:ajeet0037k@gmail.com"
                      className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      ajeet0037k@gmail.com
                    </a>
                    <p className="mt-1 text-sm text-gray-500">
                      Contact: Ajeet Kumar
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                    🔒
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Privacy Matters</h3>
                    <p className="mt-1 text-gray-600">
                      All files uploaded to AdobeWork are automatically deleted after 1 hour. 
                      We never store or share your documents.
                    </p>
                    <Link
                      href="/privacy-policy"
                      className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      Read Privacy Policy →
                    </Link>
                  </div>
                </div>
              </div>

              {/* All Tools */}
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">
                    🛠️
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Explore Our Tools</h3>
                    <p className="mt-1 text-gray-600">
                      Discover all the PDF tools AdobeWork has to offer.
                    </p>
                    <Link
                      href="/all-tools"
                      className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      View All Tools →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
