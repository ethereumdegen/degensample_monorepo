 
import axios from "axios";

 
import { useContext, useState, useEffect } from 'react';
 
import { useOutletContext, useNavigate } from 'react-router-dom';

import { observer } from "mobx-react";
import {observe} from 'mobx'

import { Tab } from "@/views/components/Headless";
 
import { getBackendServerUrl } from '@/lib/app-helper'

import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import { makeApiRequest } from '@/lib/request-lib';

 
import {
  Web3StoreContext, 
  SideMenuStoreContext,
  SideBarStoreContext
} from '@/stores/stores-context';


function Main() {
  const web3Store = useContext(Web3StoreContext);
  const sidebarStore = useContext(SideBarStoreContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    invoices_count: null, // Set to null initially to show blank state
    api_keys_count: null,
    payments_count: null,
    loading: true,
    error: null
  });

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!web3Store.account || !web3Store.authToken) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }
      
      try {
        const data = {
          session_token: web3Store.authToken,
          wallet_public_address: web3Store.account
        };
        
        const response = await makeApiRequest('/api/user/stats', 'post', data);
          
        console.log("User stats response:", response);

        if (response && response.data) {
          setStats({
            invoices_count: response.data.invoices_count || 0,
            api_keys_count: response.data.api_keys_count || 0,
            payments_count: response.data.payments_count || 0,
            loading: false,
            error: null
          });
        }
      } catch (e) {
        console.error('Failed to fetch user stats:', e);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load user statistics. Please try again later.'
        }));
      }
    };
    
    fetchUserStats();
  }, [web3Store.account, web3Store.authToken]);

  return (
    <div>
      <h2 className="heading-2 mb-6">Welcome to your Dashboard</h2>
      
      {stats.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
          <p>{stats.error}</p>
        </div>
      )}
      
      <div className="address-display mb-6">
        <p className="text-sm text-slate-500 mb-1">Connected Wallet</p>
        <p className="font-fira-code text-sm">{web3Store.account}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="stat-card bg-gradient-to-br from-deep-indigo/5 to-deep-indigo/10">
          <div className="flex items-center mb-2">
            <div className="mr-3 p-2 rounded-lg bg-deep-indigo/10">
              <LucideIcons.KeyIcon className="h-5 w-5 text-deep-indigo" />
            </div>
            <h3 className="font-semibold text-deep-indigo">API Keys</h3>
          </div>
          <p className="text-3xl font-bold text-navy-blue mt-2">
            {stats.api_keys_count !== null ? stats.api_keys_count : 
            <span className="loading-pulse"></span>}
          </p>
          <div className="mt-4 pt-3 border-t border-deep-indigo/10">
            <Link to="/dashboard/apikeys" className="text-sm text-deep-indigo font-medium flex items-center">
              Manage Keys
              <LucideIcons.ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="stat-card bg-gradient-to-br from-teal-accent/5 to-teal-accent/10">
          <div className="flex items-center mb-2">
            <div className="mr-3 p-2 rounded-lg bg-teal-accent/10">
              <LucideIcons.FileTextIcon className="h-5 w-5 text-teal-accent" />
            </div>
            <h3 className="font-semibold text-teal-accent">Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-navy-blue mt-2">
            {stats.invoices_count !== null ? stats.invoices_count : 
            <span className="loading-pulse"></span>}
          </p>
          <div className="mt-4 pt-3 border-t border-teal-accent/10">
            <Link to="/dashboard/invoices" className="text-sm text-teal-accent font-medium flex items-center">
              View Invoices
              <LucideIcons.ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="stat-card bg-gradient-to-br from-electric-purple/5 to-electric-purple/10">
          <div className="flex items-center mb-2">
            <div className="mr-3 p-2 rounded-lg bg-electric-purple/10">
              <LucideIcons.CreditCardIcon className="h-5 w-5 text-electric-purple" />
            </div>
            <h3 className="font-semibold text-electric-purple">Payments</h3>
          </div>
          <p className="text-3xl font-bold text-navy-blue mt-2">
            {stats.payments_count !== null ? stats.payments_count : 
            <span className="loading-pulse"></span>}
          </p>
          <div className="mt-4 pt-3 border-t border-electric-purple/10">
            <Link to="/dashboard/payments" className="text-sm text-electric-purple font-medium flex items-center">
              View Payments
              <LucideIcons.ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Documentation welcome section */}
      <div className="mt-10 gradient-card p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-navy-blue mb-2">New to DeFi Relay?</h3>
        <p className="text-slate-600 mb-4">
          Explore our documentation to learn how to get the most out of our platform. From setting up your first invoice to managing API keys, we've got you covered.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Link to="/docs/start" className="flex items-center p-4 bg-white rounded-xl hover:bg-deep-indigo/5 transition-colors border border-slate-200 shadow-sm">
            <div className="bg-deep-indigo/10 p-2 rounded-full mr-3">
              <LucideIcons.BookOpenIcon className="h-5 w-5 text-deep-indigo" />
            </div>
            <div>
              <h4 className="font-semibold text-navy-blue">Getting Started</h4>
              <p className="text-sm text-slate-600">Learn the basics and set up your account</p>
            </div>
          </Link>
          <Link to="/docs/payments" className="flex items-center p-4 bg-white rounded-xl hover:bg-teal-accent/5 transition-colors border border-slate-200 shadow-sm">
            <div className="bg-teal-accent/10 p-2 rounded-full mr-3">
              <LucideIcons.CreditCardIcon className="h-5 w-5 text-teal-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-navy-blue">Payment System</h4>
              <p className="text-sm text-slate-600">Understand how payments and invoices work</p>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Link to="/docs/api" className="flex items-center p-4 bg-white rounded-xl hover:bg-deep-indigo/5 transition-colors border border-slate-200 shadow-sm">
            <div className="bg-deep-indigo/10 p-2 rounded-full mr-3">
              <LucideIcons.CodeIcon className="h-5 w-5 text-deep-indigo" />
            </div>
            <div>
              <h4 className="font-semibold text-navy-blue">API Documentation</h4>
              <p className="text-sm text-slate-600">Technical details and API references</p>
            </div>
          </Link>
          <Link to="/docs/faq" className="flex items-center p-4 bg-white rounded-xl hover:bg-amber-500/5 transition-colors border border-slate-200 shadow-sm">
            <div className="bg-amber-500/10 p-2 rounded-full mr-3">
              <LucideIcons.HelpCircleIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-navy-blue">Frequently Asked Questions</h4>
              <p className="text-sm text-slate-600">Answers to common questions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default observer(Main);