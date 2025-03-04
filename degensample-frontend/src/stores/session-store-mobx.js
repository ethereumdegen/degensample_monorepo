


 
 
import { useState } from "react";
 

 
 
 
import { makeObservable, observable, action } from "mobx"
 


export class SessionStore {
    
     
    connectedAuthToken=undefined
    
    connected = false
  
    constructor() {
 
      
        makeObservable(this, {
            
            
            connectedAuthToken: observable,
            
            connected: observable ,
             
 
            connect: action,
            disconnect: action,

            saveState: action,
            loadState: action 
        })
        
    }
 
   
    async connect( {authToken }  ) {

        //mock for now 
 
        this.connectedAuthToken = authToken
        
        this.connected = true 
        this.saveState();
    }
 
    async disconnect(    ) {
 

        this.connectedAuthToken = undefined
      
        this.connected = false 
        this.saveState();
    }





  saveState() {
    const state = {
      // Include the properties you want to save in localStorage
    
      connectedAuthToken: this.connectedAppAuthToken,
      connected: this.connected 
    };

    localStorage.setItem("sessionToken", state.connectedAuthToken );
  }

  // Load state from localStorage
  loadState() {
    const storedToken = localStorage.getItem("sessionToken");
    if (storedToken) {
      //const tokenParsed = JSON.parse(storedToken);
      // Update the store properties with the loaded state

      //if the loaded state is too old DONT load it, delete it?
     /* if (this.authTokenExpiresAt && new Date(this.authTokenExpiresAt) > Date.now()) {
        console.log("tried to load expired state");
      } else {
        this.connectedAppName = state.connectedAppName;
        this.connectedAppAuthToken = state.connectedAppAuthToken;
        this.connected = state.connected; 
      }*/

        this.connectedAuthToken = storedToken ;
        this.connected = true ;
    }
  }





}



 


 