// pages/contact/index.tsx
import React from 'react';
import ContactForm from '../../components/ContactForm';

const ContactPage = () => {
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
      {/* Intro */}
      <section className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-gray-700">
          We’d love to hear from you! Reach out to us with any questions, comments, or inquiries about our projects and initiatives.
        </p>
        <p className="mt-2 text-gray-700">
          Email us at: <a href="mailto:contact@article6.org" className="underline" rel="nofollow">contact@article6.org</a>
        </p>
        <div className="mt-6">
          <a
            href="https://wa.me/2349066876272"
            aria-label="Chat on WhatsApp"
            rel="nofollow"
            className="inline-flex items-center rounded-2xl bg-green-700 text-white px-5 py-3 hover:bg-green-800"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4">Get in Touch</h2>
        <ContactForm className="bg-white p-8 shadow-sm rounded-lg mx-auto max-w-2xl" />
      </section>
    </main>
  );
};

export default ContactPage;
