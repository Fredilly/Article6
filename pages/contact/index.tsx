// pages/contact/index.tsx
import React, { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="container mx-auto py-16 px-6 max-w-4xl"> {/* Adjust max-width as needed */}
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold mb-6 text-green-700">
          Contact Us
        </h1>
        <p className="text-lg text-gray-700">
          We’d love to hear from you! Reach out to us with any questions, comments, or inquiries about our projects and initiatives.
        </p>
        <p className="text-lg text-gray-700">
          Email us at: <a href="mailto:contact@article6.org" className="text-green-700 underline" rel="nofollow">contact@article6.org</a>
        </p>
        <div className="mt-4">
          <a
            href="https://wa.me/2349066876272"
            aria-label="Chat on WhatsApp"
            rel="nofollow"
            className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Contact Form */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700 text-center">Get in Touch</h2>
        <form
          className="bg-white p-8 shadow-sm rounded-lg mx-auto max-w-2xl"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
              Message
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="message"
              placeholder="Your message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="text-center">
            <button
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>

      {/* Address Section with Map */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700 text-center">Our Office</h2>
        <p className="text-lg text-gray-700 mb-4 text-center">
          Visit us at our office for more information or to discuss potential collaborations.
        </p>
        <div className="flex justify-center mb-4">
          <iframe
            src="https://maps.google.com/maps?q=Abuja,%20Nigeria&output=embed"
            width="600"
            height="450"
            allowFullScreen
            loading="lazy"
            className="rounded-lg shadow-sm"
          ></iframe>
        </div>
        <p className="text-lg text-gray-700 text-center">
          Remote – Abuja • Lagos, Nigeria
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
