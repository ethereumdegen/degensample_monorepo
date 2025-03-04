import favicon from "@/assets/images/vector_waves_logo.png";
import homeImage from "@/assets/images/vector_waves_2.png";
import logo from "@/assets/images/refill_logo_sm_2.png";

const config = {
  title: "Defi Relay",
  tagline: "Ethereum Payment Rails",
  url: "https://defirelay.com",
  baseURL: "/",
  favicon: favicon,
  logo: logo, 
  homeImage: homeImage,

  navbar: {
    title: "",
    logo: {
      alt: "DefiRelay Logo",
      src: "assets/images/refill_logo_sm_2.png",
    },
    items: [
      
      { to: "/dashboard", label: "Dashboard" } ,
       
      { to: "/docs", label: "Learn" } , 

       
    ],
  },

  accountMenu: {
    items: [
      {
        to: "/",
        label: "Home",
      } 
    ],
  },

  footer: {
    style: "light",
    columns: [
      {
        title: "Docs",
        items: [
          {
            label: "Get Started",
            to: "/docs/",
          },

          
        ],
      },
      {
        title: "DevOps",
        items: [ 

          { href: "https://apidocs.defirelay.com", label: "Api Integration Spec" } 
          ],
      },
      {
        title: "Social",
        items: [
          {
            label: "Discord",
            href: "https://discord.gg/DhJxd53tpB",
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} `,




    socials: {
      discord: "https://discord.gg/DhJxd53tpB" ,
      twitter: "https://twitter.com/defirelay",
      
    },
  },
};

export default config;
//module.exports = config;
