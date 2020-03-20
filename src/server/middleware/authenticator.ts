import * as logger from 'node-logger';
import jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import {config} from '../../config';
import * as Promise from 'bluebird';
import {InvalidToken} from '../../errors/InvalidToken';
import * as check from 'check-types';

//-------------------------------------------------
// Auth0 Stuff
//-------------------------------------------------
const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksUri: config.auth0.jwksUri
});

const getSigningKeyAsync = Promise.promisify(client.getSigningKey);

async function getKey(kid: string): Promise<string> {
  const key = await getSigningKeyAsync(kid);
  return key.publicKey || key.rsaPublicKey;
}


//-------------------------------------------------
// Middleware to look for user credentials
//-------------------------------------------------
export async function lookForUserCredentials(req, res, next): Promise<void> {

  req.user = {
    permissions: [] // saves having to check this exists in my controllers.
  };

  // Is an access token present in the Authorization header
  if (req.headers.authorization) {

    logger.debug('authorization header provided');

    const authType = req.headers.authorization.split(' ')[0];

    if (authType === 'Bearer') {

      const accessToken = req.headers.authorization.split(' ')[1];
      logger.debug('Access token provided.');

      // Decode the token so we can get the kid from the header
      const decodedToken = jwt.decode(accessToken, {complete: true});
      
      if (decodedToken === null) {
        return next(new InvalidToken('Failed to decode token.'));
      }

      let kid;
      if (decodedToken && decodedToken.header && check.string(decodedToken.header.kid)) {
        kid = decodedToken.header.kid;
      } else {
        return next(new InvalidToken('Expected the token to include a kid property within the header'));
      }

      const key = await getKey(kid);

      // Now to verify the token
      let payload;
      try {
        payload = jwt.verify(accessToken, key, {
          issuer: config.auth0.issuer,
          audience: config.auth0.audience
        });
      } catch (err) {
        return next(new InvalidToken(err.message));
      }
      logger.debug('Token payload', payload);

      // It's the 'sub' field that has the user's ID.
      if (!payload || !payload.sub) {
        return next(new InvalidToken(`The user id should be provided in the JWT payload as the 'sub' property`));
      }  

      logger.debug('JWT is ok');  

      // Given the token is ok let's update req.user
      req.user.id = payload.sub;
      if (payload.permissions) {
        req.user.permissions = payload.permissions;
      }

    } else {
      return next(new InvalidToken(`When an authorization header is provided we expect its value to have the form: 'Bearer access_token_here'`));
    }

  }

  if (!req.user.id) {
    logger.debug('No user credentials present');
  }

  logger.debug('req.user after credentials check', req.user);

  return next();
  
}


