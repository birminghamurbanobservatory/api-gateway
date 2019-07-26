const dict = {
  400: 'Bad Request', 
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  410: 'Gone',
  429: 'Too Many Requests',
  500: 'Internal Server Error'
};


export function statusCodeToStatus(statusCode) {
  return dict[statusCode];
}