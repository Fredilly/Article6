// pages/contact/index.tsx
import React from 'react';

const ContactPage = () => {
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
          Email us at: <a href="mailto:contact@article6.org" className="text-green-700 underline">contact@article6.org</a>
        </p>
      </div>

      {/* Contact Form */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700 text-center">Get in Touch</h2>
        <form className="bg-white p-8 shadow-sm rounded-lg mx-auto max-w-2xl">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              placeholder="Your name"
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
            ></textarea>
          </div>
          <div className="text-center">
            <button
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
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
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.1931614783886!2d144.9630582153196!3d-37.814217979751954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf0727c6b4c81f2e!2sMelbourne%20CBD%2C%20Victoria%2C%20Australia!5e0!3m2!1sen!2sus!4v1611289221087!5m2!1sen!2sus"
            width="600"
            height="450"
            allowFullScreen
            loading="lazy"
            className="rounded-lg shadow-sm"
          ></iframe>
        </div>
        <p className="text-lg text-gray-700 text-center">
          ArticleSix, 123 Sustainability Street, Melbourne, VIC 3000, Australia
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
