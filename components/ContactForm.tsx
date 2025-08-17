import React from 'react';

interface ContactFormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const inputClasses = "w-full rounded-md border border-gray-300 bg-gray-100 p-3 focus:outline-none focus:ring-2 focus:ring-black";

export default function ContactForm({ className = '', ...props }: ContactFormProps) {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <input
          id="company"
          name="company"
          type="text"
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="jobTitle" className="mb-1 block text-sm font-medium text-gray-700">
          Job Title
        </label>
        <input
          id="jobTitle"
          name="jobTitle"
          type="text"
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="industry" className="mb-1 block text-sm font-medium text-gray-700">
          Select Industry
        </label>
        <select
          id="industry"
          name="industry"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Choose industry
          </option>
          <option value="technology">Technology</option>
          <option value="finance">Finance</option>
          <option value="agriculture">Agriculture</option>
          <option value="energy">Energy</option>
          <option value="government">Government</option>
        </select>
      </div>

      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
          Select Country
        </label>
        <select
          id="country"
          name="country"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Choose country
          </option>
          <option value="nigeria">Nigeria</option>
          <option value="ghana">Ghana</option>
          <option value="united-states">United States</option>
          <option value="united-kingdom">United Kingdom</option>
          <option value="canada">Canada</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={inputClasses}
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full bg-black py-3 px-4 text-white"
      >
        Submit
      </button>
    </form>
  );
}

