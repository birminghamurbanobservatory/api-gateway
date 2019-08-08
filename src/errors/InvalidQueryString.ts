import {BadRequest} from './BadRequest';

export class InvalidQueryString extends BadRequest {

  public constructor(message: string = 'Invalid query string') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain      
  }

}