import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';

const DesignSystem = () => {
  return (
    <div className="font-inter p-8 max-w-6xl mx-auto">
      <h1 className="heading-1 mb-6">Design System</h1>
      <p className="text-body mb-10">This page showcases the new design system components and styles.</p>


      {/* Color Palette */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl">
            <div className="w-full h-20 bg-deep-indigo rounded-lg mb-2"></div>
            <p className="font-medium">Blue One</p>
            <p className="font-mono text-xs">#3b5dc9</p>
          </div>
          <div className="p-4 rounded-xl">
            <div className="w-full h-20 bg-electric-purple rounded-lg mb-2"></div>
            <p className="font-medium">Muted Purple</p>
            <p className="font-mono text-xs">#29366f</p>
          </div>
          <div className="p-4 rounded-xl">
            <div className="w-full h-20 bg-teal-accent rounded-lg mb-2"></div>
            <p className="font-medium">Steel Blue</p>
            <p className="font-mono text-xs">#789aac</p>
          </div>
          <div className="p-4 rounded-xl">
            <div className="w-full h-20 bg-navy-blue rounded-lg mb-2"></div>
            <p className="font-medium">Navy Blue</p>
            <p className="font-mono text-xs">#0D1B3E</p>
          </div>
          <div className="p-4 rounded-xl">
            <div className="w-full h-20 bg-cool-gray rounded-lg mb-2"></div>
            <p className="font-medium">Cool Gray</p>
            <p className="font-mono text-xs">#F5F7FA</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="heading-1">Heading 1</h1>
            <p className="text-tiny mt-1">36px/2.25rem - Inter Bold</p>
          </div>
          <div>
            <h2 className="heading-2">Heading 2</h2>
            <p className="text-tiny mt-1">30px/1.875rem - Inter SemiBold</p>
          </div>
          <div>
            <h3 className="heading-3">Heading 3</h3>
            <p className="text-tiny mt-1">24px/1.5rem - Inter SemiBold</p>
          </div>
          <div>
            <h4 className="heading-4">Heading 4</h4>
            <p className="text-tiny mt-1">20px/1.25rem - Inter Medium</p>
          </div>
          <div>
            <p className="text-body">Body Text</p>
            <p className="text-tiny mt-1">16px/1rem - Inter Regular</p>
          </div>
          <div>
            <p className="text-small">Small Text</p>
            <p className="text-tiny mt-1">14px/0.875rem - Inter Regular</p>
          </div>
          <div>
            <p className="text-tiny">Tiny Text</p>
            <p className="text-tiny mt-1">12px/0.75rem - Inter Regular</p>
          </div>
          <div>
            <p className="font-fira-code text-base">Monospace Text</p>
            <p className="text-tiny mt-1">16px/1rem - Fira Code</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-tertiary">Tertiary Button</button>
          <button className="btn-icon">
            <LucideIcons.PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="heading-4 mb-2">Standard Card</h3>
            <p className="text-body">This is a standard card with default styling.</p>
          </div>
          <div className="card card-accent">
            <h3 className="heading-4 mb-2">Accent Card</h3>
            <p className="text-body">This card has an accent border on the left side.</p>
          </div>
          <div className="card card-accent-success">
            <h3 className="heading-4 mb-2">Success Card</h3>
            <p className="text-body">This card indicates a successful action or state.</p>
          </div>
          <div className="stat-card bg-gradient-to-br from-deep-indigo/5 to-electric-purple/10">
            <div className="flex items-center mb-2">
              <div className="mr-3 p-2 rounded-lg bg-deep-indigo/10">
                <LucideIcons.KeyIcon className="h-5 w-5 text-deep-indigo" />
              </div>
              <h3 className="font-semibold text-deep-indigo">API Keys</h3>
            </div>
            <p className="text-3xl font-bold text-navy-blue mt-2">5</p>
            <div className="mt-4 pt-3 border-t border-deep-indigo/10">
              <a href="#" className="text-sm text-deep-indigo font-medium flex items-center">
                View All
                <LucideIcons.ArrowRightIcon className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-secondary">Secondary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-danger">Danger</span>
        </div>
      </section>

      {/* Forms */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Standard Input</label>
            <input type="text" className="form-input" placeholder="Enter text here..." />
          </div>
          <div>
            <label className="form-label">Input with Error</label>
            <input type="text" className="form-input border-red-300" value="Invalid input" />
            <p className="form-error">This field is required</p>
          </div>
        </div>
      </section>

      {/* Code Block */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Code Block</h2>
        <div className="code-block">
          <pre>{`function example() {
  const greeting = "Hello, world!";
  console.log(greeting);
  return greeting;
}`}</pre>
        </div>
      </section>

      {/* Address Display */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Address Display</h2>
        <div className="address-display">
          0x71C7656EC7ab88b098defB751B7401B5f6d8976F
        </div>
      </section>
    </div>
  );
};

export default DesignSystem;