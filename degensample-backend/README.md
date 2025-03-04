
### The true journey of self-discovery begins when you become aware of the interconnectedness of all beings and recognize that the state of the world is a reflection of our collective consciousness.
 

## TODO 

 

 -Every change to credits  need to be logged like a ledger !!!
 - add deduct_credits  and get_credits   like  the blog describes ! 


 Totally finish and fix the bot for webhooks  ! it isnt totally working 


  BUILD BOTS FOR WEBHOOKS 
  REBUILD DOCUSAURUS 



BUILD A test erc20 token that infinite mints itself , on transfer  .. or has no balance or whatever 




****
1. dont allow an invoice template to spawn an invoice if there was an invoice spawned for that same customer in the last 24 hours ! 

***




// -------------



  1. Missing Endpoints:
    - Products controller endpoints completely absent
    - Checkouts controller endpoints missing
    - Most Webhook URLs endpoints not documented
    - Several Token Symbols endpoints missing
 
  3. Parameter Problems:
    - Client Key controller returns different schema than documented
    - Payment Find by Invoice UUID uses query parameter but docs show path
  parameter
    - Parameter types often mismatched with implementation
  4. Response Schema Issues:
    - Many endpoints return generic objects without specific schemas
    - ApiCreditRefill and ApiWorkspace incorrectly defined as simple types
    - Inconsistent response wrapping (some use AuthResponse, others don't)
  5. Authentication Clarity:
    - Unclear which endpoints require authentication
  6. Naming Inconsistencies:
    - Inconsistent API paths (singular vs plural)
    - Inconsistent controller namespacing
  7. Coverage Issues:
    - Approximately 50% of actual endpoints missing from documentation








 
 
 
 ## Design plan 

The front end will ONLY be chat!!!  Your chats end up making the gpt ai respond with 'functions' which are the actions you can take !!! 

(you can fill in some general settings like email address to receive the notif maybe.. )(or we just do oauth!) (maybe this is a telegram bot!!! yoooo) 


1. Build a CLI interface that allows the user to say "set a reminder of xyz  every tuesday morning at 9AM"  and then chat gpt will do a 'function call' back to this api which will ultimately insert a ScheduledTask record for the user. Boom, done . 


2. then , figure out how to make it post for you on insta 




SO TLDR : 

build a frontend where my dad can just type "every day at 11pm, publish a tweet for me with an image about bitcoin"

and what it willl do is it will hit chatGPT + functions api,  the gpt will respond with a function like "insert schedule task to public a tweet with a prompt of bitcoin image and a cron time of every day at 11pm"  

And then i will just have a service task runnning that will actually do the tweets in response to those records. that part is basically allrdy built.  

One tricky part is getting my dads auth_token in mysql but that isnt too bad just need auth flow. 



## TABLES


1. user  (sign in w ethereum bc why not ) 


2. schedules 
  -many per user.  have a time and a day.  


3. plans 
 - predefined plans such as 'send me a recipe for dinner. ... basically has a prompt in it. 
 ex. send me a new song to listen to every morning at 9am (genre)  or a poem (with this type?) they can have a wildcard... denoted with a sql-safe special char like [x].  


4. user_custom_instructions (from questionnaires)

 - many per user. tidbits of info for that user (they are vegan, they are disabled, they are elderly , etc etc )

 - these are send along with the prompt plans as personalized context abt the user 





## interesting shit about chat gpt 

For the basic user interface, take advantage of the 'calling functions' ... chat gpt can defer to calling functions in order to translate a users raw text input into a computer friendly method such as 'define a new schedule' or 'delete a schedule' bc of the raw text they sent . wow . 

https://platform.openai.com/docs/api-reference/chat/create