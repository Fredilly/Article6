// pages/contact/index.tsx
import React from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import ContactForm from '../../components/ContactForm';

const ContactPage = () => {
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
      {/* Intro */}
      <section className="mb-16">
        <div className="max-w-xl mx-auto p-8 text-center space-y-4 rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <h1 className="text-3xl md:text-5xl font-bold">Contact Us</h1>
          <p className="text-gray-600">
            We work with governments, corporates, and partners worldwide. Connect with us to discuss projects, partnerships, or opportunities.
          </p>
          <p>
            <a
              href="mailto:contact@article6.org"
              className="inline-flex items-center text-blue-600 font-semibold hover:underline"
              rel="nofollow"
            >
              <EnvelopeIcon className="h-5 w-5 mr-1" aria-hidden="true" />
              contact@article6.org
            </a>
          </p>
          <div>
            <a
              href="https://wa.me/2349066876272"
              aria-label="Chat on WhatsApp"
              rel="nofollow"
              className="inline-flex items-center rounded-full bg-green-600 text-white px-5 py-3 hover:bg-green-700"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mb-16">
        <ContactForm className="bg-white p-8 shadow-sm rounded-lg mx-auto max-w-2xl" />
      </section>
    </main>
  );
};

export default ContactPage;
