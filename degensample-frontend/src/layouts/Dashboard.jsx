import { Transition } from "react-transition-group";
import { useState, useEffect, useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { linkTo, nestedMenu, enter, leave } from "./index";
import { Lucide } from "@/base-components";

import dom from "@left4code/tw-starter/dist/js/dom";
import SimpleBar from "simplebar";
 
import classnames from "classnames";
import TopBar from "@/views/components/top-bar/Main";
 
import Web3Sidebar from "@/views/components/web3-sidebar/Main.jsx";
 
import { observer } from "mobx-react";
 
// import SideMenu from '@/views/components/side-menu/Main.jsx'
import * as LucideIcons from 'lucide-react';
import { ChevronRightIcon } from 'lucide-react';
 
import DashboardConfig from '@/config/dashboard-config';
import SignInRequiredWarning from "@/views/components/sign-in-required-warning/Main";
 
import {
  Web3StoreContext, 
 // SideMenuStoreContext,
  SideBarStoreContext
} from '@/stores/stores-context';
 

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Home');

  //const sideMenuStore = useContext(SideMenuStoreContext);  // DEPRECATED 
  const web3Store = useContext(Web3StoreContext);
  const sidebarStore = useContext(SideBarStoreContext);

  // Map configuration into component with icons
  const sidebarOptions = DashboardConfig.sidebarOptions.map(option => {
    const IconComponent = LucideIcons[`${option.icon}Icon`];
    return {
      ...option,
      icon: <IconComponent className="w-5 h-5" />
    };
  });



   const  productsList = DashboardConfig.productsList.map(option => {
    const IconComponent = LucideIcons[`${option.icon}Icon`];
    return {
      ...option,
      icon: <IconComponent className="w-5 h-5" />
    };
  });

  // Handle tab navigation
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // Convert tab ID to URL path - if Home, navigate to dashboard root
    const path = tabId === 'Home' ? '' : tabId.toLowerCase();
    navigate(`/dashboard/${path}`);
  };
  
  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname.split('/').pop() || '';
    
    if (path === 'dashboard' || path === '') {
      setActiveTab('Home');
    } else {
      // Find the matching tab based on path
      const matchingTab = DashboardConfig.sidebarOptions.find(
        option => option.id.toLowerCase() === path
      );

      
      
      if (matchingTab) {
        setActiveTab(matchingTab.id);
      }
    }
  }, [location.pathname]);

  return (
    <div className="flex">
      <Web3Sidebar slot={<div> </div>} />  

    

      {/* BEGIN: Content */}
      <div className="flex-grow">
        

 

        <div className="content relative">
          <div className="font-inter">
            <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-deep-indigo/5 to-electric-purple/5 rounded-xl mb-6">
              <h1 className="text-3xl font-bold text-navy-blue mb-2">Dashboard</h1>
              <p className="text-slate-600">Manage your payments, invoices and API keys</p>
            </div>

            <div className="w-full">
              <SignInRequiredWarning authorized={web3Store.authorized}>
                <div className="bg-gradient-to-r from-deep-indigo/10 to-electric-purple/10 p-6 rounded-xl border border-deep-indigo/20 flex items-center">
                  <div className="mr-4 bg-white p-3 rounded-full shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-deep-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-navy-blue">Connect your wallet</h3>
                    <p className="text-slate-600">Connect with Web3 to access your dashboard and start earning</p>
                  </div>
                </div>
              </SignInRequiredWarning> 

              {web3Store.authorized && (
                <div className="flex w-full mt-5 font-inter">
                  {/* Sidebar */}
                  <aside className="sidebar-nav">
                    <nav className="p-5">
                      <h2 className="text-lg font-semibold text-navy-blue mb-5">Dashboard</h2>
                      <ul className="space-y-2">
                        {sidebarOptions.map((option) => (
                          <li key={option.id}>
                            <button
                              onClick={() => handleTabClick(option.id)}
                              className={`sidebar-nav-item ${
                                activeTab === option.id
                                  ? 'sidebar-nav-item-active'
                                  : 'sidebar-nav-item-inactive'
                              }`}
                            >
                              <span className="mr-3 text-lg">{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                              {activeTab === option.id && (
                                <ChevronRightIcon className="ml-auto w-4 h-4" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>



                         <h2 className="text-lg font-semibold text-navy-blue mt-5">Products</h2>

                       <ul className="space-y-2">
                        {productsList.map((option) => (
                          <li key={option.id}>
                            <button
                              onClick={() => handleTabClick(option.id)}
                              className={`sidebar-nav-item ${
                                activeTab === option.id
                                  ? 'sidebar-nav-item-active'
                                  : 'sidebar-nav-item-inactive'
                              }`}
                            >
                              <span className="mr-3 text-lg">{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                              {activeTab === option.id && (
                                <ChevronRightIcon className="ml-auto w-4 h-4" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>


                      
                      {/* Help section */}
                      <div className="mt-8 p-4 bg-gradient-to-r from-deep-indigo/5 to-electric-purple/5 rounded-xl border border-deep-indigo/10">
                        <h3 className="text-sm font-semibold text-navy-blue mb-2">Need Help?</h3>
                        <p className="text-xs text-slate-600 mb-3">Check our documentation or contact support</p>
                        <a href="/docs" className="btn-tertiary text-xs inline-flex items-center">
                          View Documentation
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>
                      </div>
                    </nav>
                  </aside>

                  {/* Main content */}
                  <main className="main-container ml-6">
                    <Outlet />
                  </main>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* END: Content */}
    </div>
  );
}

export default observer(Dashboard);