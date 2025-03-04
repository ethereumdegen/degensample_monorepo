import React, { useState, useEffect } from 'react';

function HeroHome() {
  const [currentWord, setCurrentWord] = useState('defi');
  const words = ['evm', 'web3', 'ethereum', 'crypto'];
  const colors = ['text-blue-500', 'text-red-500', 'text-green-500', 'text-yellow-500'];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWord((prevWord) => {
        const currentIndex = words.indexOf(prevWord);
        const nextIndex = (currentIndex + 1) % words.length;
        return words[nextIndex];
      });
    }, 2000); // changes every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  const currentColor = colors[words.indexOf(currentWord)];

  return (
    <section className="relative bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-24 pb-12 md:pt-32 md:pb-20 flex flex-col items-center justify-center min-h-screen">
          
          {/* Hero content */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">Sample App</h1>
            <p className="text-xl md:text-2xl font-light mb-6">
              <span className={`${currentColor} inline-block animate-pulse`}>{currentWord}</span> payment rails
            </p>
            
            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <a
                href="/dashboard/" >
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Get Started
              </button>
              </a> 
              <a
                href="/docs/"
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroHome;
