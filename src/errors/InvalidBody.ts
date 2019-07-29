import {BadRequest} from './BadRequest';

export class InvalidBody extends BadRequest {

  public constructor(message: string = 'Invalid body') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain      
  }

}