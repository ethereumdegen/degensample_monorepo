
  
import favicon from '@/assets/images/warp.gif'
import homeImage from '@/assets/images/degen_tx_banner.png'

const config = {
    title: 'Defi Relay',
    
    favicon: favicon,
    homeImage: homeImage,
     


   

    dashboardMenu: [
        "NAVIGATION",

          
            {
              icon: "Home",
              title: "Dashboard",
              pathname: "/dashboard",
             
           /*   subMenu: [
              {  icon: "",
                pathname: "/chart",
                title: "Chart"
              }
              ]*/


            },
 

            {
              icon: "MessageSquare",
              title: "Invoices",
              pathname: "/dashboard/invoices",             
              
            },
            
            {
              icon: "Zap",
              title: "Premium",
              pathname: "/dashboard/premium",
              className: "premium-menu-item text-white/70" // Lighter gray text
            },
 
      
            
    ],
    
    // Sidebar navigation options for dashboard_inner
    sidebarOptions: [
        { id: 'Home', label: 'Home', icon: 'Home' },
    
        { id: 'Invoices', label: 'Invoices', icon: 'FileText' },
        { id: 'Payments', label: 'Payments', icon: 'CreditCard' },
        { id: 'Webhooks', label: 'Webhooks', icon: 'Bell' },
            { id: 'ApiKeys', label: 'API Keys', icon: 'Key' },
        { id: 'Premium', label: 'Premium', icon: 'Zap' },
    ],



     productsList: [
        { id: 'RefillWorkspaces', label: 'API Refill', icon: 'Home' },
     
    ]
      
      


  
    

}



export default config;
//module.exports = config;
