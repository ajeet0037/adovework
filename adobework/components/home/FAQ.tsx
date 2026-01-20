'use client';

import React, { useState } from 'react';
import { FAQ as FAQType } from '@/types/tool';

const homeFAQs: FAQType[] = [
  {
    question: 'Is AdobeWork really free to use?',
    answer: 'Yes! All essential PDF tools on AdobeWork are completely free to use. There are no hidden fees, no registration required, and no watermarks on your converted files.',
  },
  {
    question: 'Are my files secure on AdobeWork?',
    answer: 'Absolutely. Your privacy is our priority. All uploaded files are automatically deleted from our servers after 1 hour. We use secure HTTPS connections and never share your documents with third parties.',
  },
  {
    question: 'What file formats does AdobeWork support?',
    answer: 'AdobeWork supports a wide range of formats including PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), and images (JPG, PNG). You can convert between these formats and perform various PDF operations.',
  },
  {
    question: 'Is there a file size limit?',
    answer: 'Free users can upload files up to 50MB. This is sufficient for most documents. For larger files, consider our premium plan which supports files up to 500MB.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No account is required to use AdobeWork. Simply upload your file, choose your conversion or editing option, and download the result. It\'s that simple!',
  },
  {
    question: 'Can I use AdobeWork on mobile devices?',
    answer: 'Yes! AdobeWork is fully responsive and works great on smartphones and tablets. You can convert and edit PDFs on the go from any device with a web browser.',
  },
];

interface FAQItemProps {
  faq: FAQType;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-gray-900 pr-4">
          {faq.question}
        </span>
        <span className="flex-shrink-0 ml-2">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  );
};

export interface FAQProps {
  faqs?: FAQType[];
  title?: string;
  subtitle?: string;
}

export const FAQ: React.FC<FAQProps> = ({
  faqs = homeFAQs,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about AdobeWork',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
