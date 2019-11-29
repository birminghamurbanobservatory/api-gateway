import {Unauthorized} from './Unauthorized';

export class InvalidToken extends Unauthorized {

  public constructor(message = 'Invalid JSON Web Token') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain     
  }

}