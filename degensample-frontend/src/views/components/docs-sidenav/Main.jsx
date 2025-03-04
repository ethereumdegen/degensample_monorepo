//import React,{ useState , useRef, useEffect} from 'react';
 
  

//import DocsConfig from '@/config/docs-config'





import SidenavElement from '@/views/components/sidenav-element/Main'



import React, { useState, useRef, useEffect } from "react";

import DocsConfig from "@/config/docs-config";

//import SidenavElement from "@/views/base-components/sidenav-element/sidenav-element";

function DocsSidenav({}) {
  let [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className=" p-6  w-full flex flex-col hidden lg:block  ">
        <div
          className="flex flex-col font-ubuntu  text-lg text-gray-500 "
          style={{ minWidth: "200px" }}
        >
          {DocsConfig.navbar.items.map((item, index) => (
            <SidenavElement
              key={index}
              label={item.label}
              to={item.to}
            ></SidenavElement>
          ))}
        </div>
      </div>
    </>
  );
}

export default DocsSidenav;
