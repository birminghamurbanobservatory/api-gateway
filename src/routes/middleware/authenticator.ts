


export async function lookForUserCredentials(req, res, next): Promise<void> {

  req.user = {};

  // TODO: i.e. see if a JWT or apiKey is present in the authorization header.

  next();
  
}