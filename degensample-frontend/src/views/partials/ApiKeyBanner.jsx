import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function ApiKeyBanner() {
  const [counter, setCounter] = useState(0);
  const counterRef = useRef(null);
  
  // Animation for the counter
  useEffect(() => {
    // Animation function
    const animateCounter = () => {
      // Start the counter animation
      let startValue = 0;
      const endValue = 100;
      const duration = 1000; // 1 second
      const frameDuration = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameDuration);
      const increment = endValue / totalFrames;
      
      // Use requestAnimationFrame for smoother animation
      let frame = 0;
      const animate = () => {
        frame++;
        const newValue = Math.min(Math.round(increment * frame), endValue);
        setCounter(newValue);
        
        if (newValue < endValue) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };
    
    // Only animate once when component mounts
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        // Fix for React strict mode which might cause double effect calls
        if (counter === 0) {
          animateCounter();
        }
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    // Start observing
    if (counterRef.current) {
      observer.observe(counterRef.current);
    }
    
    return () => {
      if (counterRef.current) {
        observer.disconnect();
      }
    };
  }, []);
  
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          {/* Content Area */}
          <div className="w-full md:w-2/3 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Build Your <span className="text-blue-400">Product</span>, Not<br/>
              <span className="text-yellow-300">An API Billing Framework</span>
            </h2>
            
            <div className="prose prose-lg text-gray-300 max-w-3xl">
              <p className="text-xl font-light leading-relaxed">
                <span className="font-semibold">Thousands of developers</span> are wasting <span className="text-yellow-300">hundreds of hours</span> building custom API key management and payment systems from scratch.
              </p>
              
              <p className="text-lg">
                Why spend weeks building payment infrastructure when your core product is waiting? 
                Refill by DeFi Relay gives you a turnkey solution for API monetization, so you can:
              </p>
              
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li className="text-gray-200">Launch your API business <span className="font-medium text-blue-300">10x faster</span></li>
                <li className="text-gray-200">Accept crypto payments <span className="font-medium text-blue-300">out of the box</span></li>
                <li className="text-gray-200">Focus on what matters: <span className="font-medium text-blue-300">your core product</span></li>
              </ul>
            </div>
            
            <div className="pt-6 flex gap-4">
              <Link 
                to="/blog/refill" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
              >
                Learn More
              </Link>
              <Link 
                to="/refill/workspaces" 
                className="inline-flex items-center px-6 py-3 border border-blue-400 text-base font-medium rounded-md shadow-sm text-blue-400 hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
          
          {/* Illustration/Visual Area */}
          <div className="w-full md:w-1/3 mt-10 md:mt-0 flex justify-center">
            <div className="relative">
              {/* Visual representation of time saved - a simplified clock or time graphic */}
              <div className="w-64 h-64 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="text-center" ref={counterRef}>
                  <div className="text-5xl font-bold text-blue-300">
                    <span className="tabular-nums">{counter}</span>+
                  </div>
                  <div className="text-xl text-blue-100">Hours Saved</div>
                </div>
              </div>
              
              {/* Small decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ApiKeyBanner;