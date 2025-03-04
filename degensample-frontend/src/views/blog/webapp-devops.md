# Deploying a Webserver: An Opinionated Guide for New DevOps and Programmers

 If you're new and want to learn how to deploy a web server, this guide is for you. This is my opinionated guide with six essential steps to get a web server up and running. These steps will lightly cover everything from domain purchasing to configuring your server to run applications.  If you get stuck or lost, I recommend asking chat-gpt4 or another LLM.  Im serious thats the best way atm. 

## Table of Contents
- [Purchase a .com Domain](#purchase-a-com-domain)
- [Set Up Cloudflare](#set-up-cloudflare)
- [Create a Droplet on DigitalOcean](#create-a-droplet-on-digitalocean)
- [Configure DNS on Cloudflare](#configure-dns-on-cloudflare)
- [Configure Nginx on Ubuntu](#configure-nginx-on-ubuntu)
- [About Application Architecture](#about-application-architecture)

---

## Purchase a .com Domain

Your first step is to purchase a domain name from a trusted provider such as Google Domains, Squarespace, or others. The domain name serves as the address for your website. Typically, the cost of a `.com` domain ranges from $10 to $20 per year.

**Steps:**
1. Visit the website of the domain provider.
2. Use the search bar to find the availability of your preferred domain name.
3. Follow the prompts to purchase the domain name.

---

## Set Up Cloudflare

Once you have your domain, the next step is to add it to your Cloudflare account for DNS and security services. If you don't have an account, signing up is free.

**Steps:**
1. Log in to your Cloudflare account.
2. Click on `Add a Site` and enter your domain name.
3. Follow the setup guide, and when prompted, update the nameservers for your domain with the ones provided by Cloudflare. This usually happens at the dashboard of your domain provider.

---

## Create a Droplet on DigitalOcean

A droplet is essentially a Virtual Private Server (VPS). We will be using DigitalOcean to create an Ubuntu 20.04 droplet.

**Steps:**
1. Log in to your DigitalOcean account.
2. Click `Create` -> `Droplet`.
3. Choose Ubuntu 20.04 as the OS and select the $6/month plan.
4. Create the droplet and take note of the public IP address assigned to it.

---

## Configure DNS on Cloudflare

Now that you have your droplet, you'll need to configure your DNS records on Cloudflare to point to the IP address of the droplet.

**Steps:**
1. Go back to your Cloudflare account and navigate to the DNS settings.
2. Add an `A` record with the name `@` pointing to your droplet's IP address.
3. Add another `A` record with the name `api` also pointing to your droplet's IP address.
4. Once we tinker with our Nginx service in the next step, this will let us host two different services on the same server which can be called separately by YOURDOMAIN.com and api.YOURDOMAIN.com respectively.  This will be useful for a frontend and for a backend.  

---

## Configure Nginx on Ubuntu

We're going to use Nginx as our web server on Ubuntu. We'll configure it to listen on two server blocks: one for the API and another for the root hostname. These blocks will proxy requests to specific ports.

**Steps:**

1. SSH into your droplet: 
    ```bash
    ssh root@your_droplet_ip
    ```
2. Install Nginx if it is not already
    ```bash
    sudo apt update
    sudo apt install nginx
    ```

3. Edit the Nginx configuration file:
    ```bash
    sudo nano /etc/nginx/sites-enabled/default 
    ```


  

4. For `frontend`, insert the following configuration for our frontend service which will run on port 3000 (instead of proxy passing to a port you can also just serve static built files here if you are an advanced user and can deal with file permissions):
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com;

        location / {
            proxy_pass http://localhost:3000;
        }
    }
    ```
 

5. For `api`, insert the following configuration for our backend service which will run on port 8000:
    ```nginx
    server {
        listen 80;
        server_name api.your_domain.com;

        location / {
            proxy_pass http://localhost:8000;
        }
    }
     ```

6. Test Nginx configurations and restart:
    ```bash
    sudo nginx -t
    sudo service nginx restart
    ```

---

## About Application Architecture

Finally, a note on application architecture. You could host a frontend server, such as React + Express to publish the static files on port 3000. Likewise, a Web API server like Express in Node or Actix in Rust could be hosted on port 8000 for your GET and POST endpoints with database connection and other backend secrets that need to be obscured behind endpoints. These ports correspond to the Nginx configurations we set up earlier.

---

Congratulations! You've just deployed your own web server.  
