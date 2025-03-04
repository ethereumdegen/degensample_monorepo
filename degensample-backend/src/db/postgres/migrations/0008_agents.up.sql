CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    
    

    name VARCHAR(255) UNIQUE NOT NULL, 

    description TEXT NOT NULL, 

    owner_wallet_address   VARCHAR(255) NOT NULL,      


    endpoint_url  VARCHAR(255),

    github_url  VARCHAR(255),

       
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
      

 

);

 
  