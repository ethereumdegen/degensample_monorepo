import React, { useContext, useState, useEffect } from 'react';
import { observer } from "mobx-react";
import { Web3StoreContext } from '@/stores/stores-context';
import * as LucideIcons from 'lucide-react';
import { makeApiRequest } from '@/lib/request-lib';
import PaymentButton from '@/views/components/payment-button/Main';


const PremiumPage = () => {
  const web3Store = useContext(Web3StoreContext);
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    loading: true,
    error: null
  });

  // Fetch user stats to check premium status
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!web3Store.account || !web3Store.authToken) {
        setPremiumStatus(prev => ({ ...prev, loading: false }));
        return;
      }
      
      try {
        const data = {
          session_token: web3Store.authToken,
          wallet_public_address: web3Store.account
        };
        
        const response = await makeApiRequest('/api/user/premium', 'post', data);
          
        console.log("User premium response:", response);

        if (response && response.data) {
          setPremiumStatus({
            isPremium: response.data.is_premium || false,
            loading: false,
            error: null
          });
        }
      } catch (e) {
        console.error('Failed to fetch premium status:', e);
        setPremiumStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load premium status. Please try again later.'
        }));
      }
    };
    
    fetchUserStats();
  }, [web3Store.account, web3Store.authToken]);

  // Premium invoice template UUID - hardcoded for this specific use case
  const PREMIUM_INVOICE_TEMPLATE_UUID = "0xa008aec86bdeedbf953f443f5b833afb513bd9e63f86c179646b041e8b70b3e1";
  
  // Handle successful payment 
  const handlePaymentSuccess = (txHash) => {
    console.log("Premium payment successful with tx hash:", txHash);
    
    // Update premium status after successful transaction
    setPremiumStatus({ 
      isPremium: true, 
      loading: false, 
      error: null 
    });
  };
  
  // Handle payment error
  const handlePaymentError = (error) => {
    console.error("Premium payment error:", error);
  };

  // Premium benefits component
  const PremiumBenefits = () => (
    <div className="gradient-card p-6 rounded-xl mt-6">
      <h3 className="text-lg font-semibold text-navy-blue mb-4">Premium Benefits</h3>
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="mr-3 p-2 rounded-lg bg-deep-indigo/10">
            <LucideIcons.MessageCircleIcon className="h-5 w-5 text-deep-indigo" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-blue">Exclusive Discord Role</h4>
            <p className="text-slate-600">Get access to premium channels and direct support from our team.</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="mr-3 p-2 rounded-lg bg-teal-accent/10">
            <LucideIcons.HeadphonesIcon className="h-5 w-5 text-teal-accent" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-blue">1-on-1 Integration Support</h4>
            <p className="text-slate-600">Schedule personal sessions with our developers to help with your integration.</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="mr-3 p-2 rounded-lg bg-electric-purple/10">
            <LucideIcons.ZapIcon className="h-5 w-5 text-electric-purple" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-blue">Powered by DefiRelay</h4>
            <p className="text-slate-600">This premium purchase experience is powered by the same technology we offer to our customers.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render premium status and purchase option
  return (
    <div>
      <h2 className="heading-2 mb-6">Premium Membership</h2>
      
      {premiumStatus.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
          <p>{premiumStatus.error}</p>
        </div>
      )}
      
      {/* Premium status card */}
      <div className="stat-card bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <div className="flex items-center mb-2">
          <div className="mr-3 p-2 rounded-lg bg-amber-500/10">
            <LucideIcons.ZapIcon className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-amber-500">Premium Status</h3>
        </div>
        
        {premiumStatus.loading ? (
          <p className="text-3xl font-bold text-navy-blue mt-2">
            <span className="loading-pulse"></span>
          </p>
        ) : premiumStatus.isPremium ? (
          <div>
            <p className="text-xl font-bold text-navy-blue mt-2">
              Active
            </p>
            <p className="text-slate-600 mt-2">
              Thank you for being a premium member! You have access to all premium features and support.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-bold text-navy-blue mt-2">
              Not Active
            </p>
            <p className="text-slate-600 mt-2">
              Upgrade to premium to unlock exclusive benefits and features.
            </p>
            <PaymentButton 
              invoiceTemplateUuid={PREMIUM_INVOICE_TEMPLATE_UUID}
              customerAddress={web3Store.account}
              className="mt-4 btn btn-primary"
              buttonText="Purchase Premium ($5 USDC)"
              showTransactionLinks={true}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        )}
      </div>
      
      {/* Show benefits for non-premium users */}
      {!premiumStatus.isPremium && !premiumStatus.loading && <PremiumBenefits />}
      
      {/* For premium users, show a thank you message */}
      {premiumStatus.isPremium && !premiumStatus.loading && (
        <div className="gradient-card p-6 rounded-xl mt-6">
          <h3 className="text-lg font-semibold text-navy-blue mb-2">Thank You for Your Support!</h3>
          <p className="text-slate-600 mb-4">
            As a premium member, you now have access to exclusive features and support. Here's how to get the most out of your membership:
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-3 p-2 rounded-lg bg-deep-indigo/10">
                <LucideIcons.MessageCircleIcon className="h-5 w-5 text-deep-indigo" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-blue">Join Our Discord</h4>
                <p className="text-slate-600">Connect your wallet in our Discord server to unlock your premium role.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 p-2 rounded-lg bg-teal-accent/10">
                <LucideIcons.CalendarIcon className="h-5 w-5 text-teal-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-blue">Schedule Support</h4>
                <p className="text-slate-600">Reach out to schedule your 1-on-1 integration support session.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default observer(PremiumPage);