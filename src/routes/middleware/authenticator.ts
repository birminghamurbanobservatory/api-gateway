import * as logger from 'node-logger';


export async function lookForUserCredentials(req, res, next): Promise<void> {

  req.user = {};

  // TODO: i.e. see if a JWT or apiKey is present in the authorization header.

  // Temporary solution (TODO; replace this with JWT and apiKeys later)
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'userId') {
    req.user.id = req.headers.authorization.split(' ')[1];
    logger.debug(`User id ${req.user.id} was provided in the autorization header`);
  }

  if (!req.user.id) {
    logger.debug('Request did not supply a user id ');
  }

  next();
  
}