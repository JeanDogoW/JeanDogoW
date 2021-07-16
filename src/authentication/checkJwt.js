const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const authConfig = require("./authConfig");

// from https://auth0.com/docs/quickstart/backend/nodejs
// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const authMiddleware = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and 
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://perimeter.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: authConfig.audience,
  issuer: [`https://perimeter.auth0.com/`],
  algorithms: ['RS256']
});

module.exports = { withAuth: authMiddleware }
