'use client';
import { Typewriter } from 'react-simple-typewriter';

const words = ['Innovative', 'Climate-Smart', 'Impactful'];

export default function Hero() {
  return (
    <section className="bg-white py-24 text-center">
      <h1 className="text-4xl font-semibold">
        Article6 is{' '}
        <span className="text-brand-dark">
          <Typewriter words={words} loop={0} cursor={true} cursorClassName="ml-1" />
        </span>
      </h1>
    </section>
  );
}
