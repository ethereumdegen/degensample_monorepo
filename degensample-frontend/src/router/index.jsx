import { useRoutes } from "react-router-dom";
import MainLayout from "../layouts/Main";
import BlogLayout from "../layouts/Blog";
import ContextLayout from "../layouts/Context";
 
import Welcome from '../views/welcome/Main';
import Dashboard from '../layouts/Dashboard';
import DashboardHome from '../views/dashboard/Home';

import Blog from '../views/blog/blog.md';   

import ErrorPage from "../views/error-page/Main";

 
 
function Router() {
  const routes = [

    {
      element:<ContextLayout /> ,
    children: [


      {
      
        element: <MainLayout />,
        children:  [
          
          
          {
            path:"/",
            element: <Welcome />, 
          },
 


       


          {
            path: "/dashboard",
            element: <Dashboard />,
            children: [
              {
                path: "",
                element: <DashboardHome />,
              }
            ],
          },
  



 

         
 
 

        ]
      
    },


   
     
     
        {
          
          element: <BlogLayout />,
          children: [
            {
              path: "/docs",
              element: <Blog />,
            },

           
          
          ],
        },

       
 


      {
        path: "/error-page",
        element: <ErrorPage />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },


    ]
    }
    
  ];

  return useRoutes(routes);
}

export default Router;
