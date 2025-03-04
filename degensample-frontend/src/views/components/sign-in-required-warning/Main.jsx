 

import LoginHeaderBlock from "@/views/components/login-header-block/Main.jsx";
 

function Main( {authorized, children}) {

    return (
      
    <>
    {!authorized  && 
      
    <div className="px-4 py-16  ">

        <div className="px-4 py-4 text-lg font-bold" > 
     {children}
        </div> 

         <div className="px-4 py-4 text-lg font-bold" > 
                  <LoginHeaderBlock
                   
                   ></LoginHeaderBlock>
            </div> 

    </div>

    }
    </>
    );
  }
  
  export default Main;
  