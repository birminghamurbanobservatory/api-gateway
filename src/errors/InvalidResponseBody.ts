
// I don't want this to be an extension of OperationalError, as an invalid response body is more indicative of a programmed error
export class InvalidResponseBody extends Error {

  public statusCode: number;
  public errorCode: string;
  public privateMessage: string;

  public constructor(message: string = 'The constructed response body did not match what was expected, therefore it was not safe return.', privateMessage?: string) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    // Ensure the name of this error is the same as the class name.
    this.name = this.constructor.name;
    // Add a statusCode, useful when converting an error object to a HTTP response
    this.statusCode = 500;
    this.privateMessage = privateMessage;
  }

}
