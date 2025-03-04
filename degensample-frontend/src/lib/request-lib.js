

import React, { useState, useEffect, useContext } from 'react';
import { getBackendServerUrl } from '@/lib/app-helper';
import { Web3StoreContext } from '@/stores/stores-context';
 


import axios from 'axios'




export async function postRequest( 
	uri, 
	data, 
 ){	

 
  	let response = await axios.post(uri, data ) 

 
    return response
}

// Helper function for API requests
export const makeApiRequest = async (url, method, data = null) => {
  try {
    // For GET requests, convert data to URL parameters
    let requestUrl = `${getBackendServerUrl()}${url}`;
    
    if (method.toLowerCase() === 'get' && data) {
      // Convert data object to URL parameters
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        // Handle arrays specially
        if (Array.isArray(value)) {
          value.forEach(item => params.append(`${key}[]`, item));
        } else if (value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      // Append params to URL
      const queryString = params.toString();
      if (queryString) {
        requestUrl += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      
      // Clear data since it's now in the URL
      data = null;
    }
    
    const response = await axios({
      method,
      url: requestUrl,
      data, // Will be null for GET requests after processing
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Request failed');
    }
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    throw error;
  }
};