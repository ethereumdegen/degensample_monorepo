import React from 'react';
import { Link } from 'react-router-dom';

import FrontendConfig from '@/config/frontend-config'
 


function Footer() {
  return (
    <footer>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Top area: Blocks */}
        <div className="grid sm:grid-cols-12 gap-8 py-8 md:py-12 border-t border-gray-200">



          {/* 1st block */}
          <div className="sm:col-span-12 lg:col-span-3">
            <div className="mb-2">
              {/* Logo */}
             
            </div>
             
          </div>




        {FrontendConfig.footer.columns.map((column, column_index) => (
          
        
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2" key={column_index}>
          <h6 className="text-gray-800 font-medium mb-2">{column.title}</h6>
          <ul className="text-sm">
            {column.items.map((item,index)=>(
              <li className="mb-2" key={index}>
                {item.to &&   <Link to={item.to}  className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">{item.label}</Link>}
                {item.href &&   <a href={item.href}  className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">{item.label}</a>}
              
              </li>
            ))}
                                       
          </ul>
        </div>
       
       ))}


         
 
       

        </div>

        {/* Bottom area */}
        <div className="md:flex md:items-center md:justify-between py-4 md:py-8 border-t border-gray-200">

          {/* Social links */}
          <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
            {FrontendConfig.footer.socials.twitter && 
            <li>
              <a href={FrontendConfig.footer.socials.twitter} className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out" aria-label="Twitter">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a>
            </li> 
            }
             {FrontendConfig.footer.socials.github && 
            <li className="ml-4">
              <a href={FrontendConfig.footer.socials.github} className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out" aria-label="Github">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
              </svg>

              </a>
            </li>
              } 

               {FrontendConfig.footer.socials.discord && 
            <li className="ml-4">
              <a href={FrontendConfig.footer.socials.discord} className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out" aria-label="Github">
              <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                      <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                      <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3" />
                      <path d="M7 16.5c3.5 1 6.5 1 10 0" />
                    </svg>
              </a>
            </li>
              } 

            
          </ul>

          {/* Copyrights note */}
         
        </div>

      </div>
    </footer>
  );
}

export default Footer;
