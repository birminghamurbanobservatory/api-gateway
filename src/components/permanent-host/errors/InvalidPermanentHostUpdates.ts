import {BadRequest} from '../../../errors/BadRequest';

export class InvalidPermanentHostUpdates extends BadRequest {

  public constructor(message: string = 'Invalid permanent host updates') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

}