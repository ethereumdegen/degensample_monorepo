import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LoginHeaderBlock from "@/views/components/login-header-block/Main.jsx";
 
import FrontendConfig from '@/config/frontend-config'
 
 
 
import { observer } from "mobx-react" 


function Header( {sidebarStore, web3Store, sessionStore, headerStore} ) {

  const [top, setTop] = useState(true);

  const navigate = useNavigate();

  // detect whether user has scrolled the page down by 10px 
  useEffect(() => {
    const scrollHandler = () => {
      window.pageYOffset > 10 ? setTop(false) : setTop(true)
    };
    window.addEventListener('scroll', scrollHandler);
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [top]);  



  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    // Remove session token from localStorage to log out
    localStorage.removeItem('sessionToken');
    setIsLoggedIn(false);
    navigate('/'); // Redirect to login page after logout
  };


  return (
    <header 
      className={`w-full transition duration-300 ease-in-out ${!top ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-gradient-to-r from-deep-indigo/5 to-electric-purple/5'}`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Site branding */}
          <div className="flex items-center mr-4">
            {/* Mobile menu button */}
            <div 
              className="xl:hidden cursor-pointer bg-white p-2 rounded-lg shadow-sm hover:shadow transition-all mr-2" 
              onClick={()=>{ headerStore.toggleMobileNav() }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path 
                  stroke="#3A1D8C" 
                  strokeLinecap="round" 
                  strokeMiterlimit="10" 
                  strokeWidth="2" 
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                className="h-10 w-10 rounded-full shadow-sm"
                src={FrontendConfig.logo}
                alt="Sample App Logo"
              />
              <span className="font-inter font-semibold text-deep-indigo text-xl ml-2.5">
                Sample App
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex ml-8 space-x-1">
              {FrontendConfig.navbar.items.map((item, index) => (
                <Link 
                  to={item.to ? item.to : item.href} 
                  className="px-4 py-2 rounded-lg text-navy-blue hover:bg-electric-purple/10 transition-colors font-inter text-sm font-medium" 
                  key={index}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Site navigation */}
          <nav className="flex">
            <ul className="flex items-center">
              <div className="ml-3">
                <LoginHeaderBlock />
              </div>
            </ul>
          </nav>

        </div>
      </div>
    </header>
  );
}

export default observer(Header);
