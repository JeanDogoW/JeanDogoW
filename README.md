# Perimeter Server

## Getting Started

### Setting up Local Environment
This is an nodeJS + express web server. Ensure you have node 14 installed. You can check your node version with:
```
node -v
```

You will also need to have typscript installed. You can do this with:
```
npm install typescript -g
```

For security, the live database is only accessable from inside our AWS network, or from a set of IPs we've manually designated. 
In order to run local server requests that query the database, you must add your home IP to this list:

1. Log into AWS console with your credentials
2. Ensure the region is set to us-west-2
3. Navigate to the RDS resource and into the `perimeter-slc-db` database
4. Find and edit the 'Security Group Rules' with the list of IPs

After these steps, your local server will be able to connect to the live database.

To install existing dependencies, use:
```
npm ci
```

### Running the Server
to run the server:
```
npm run compile
npm run start
```
