import {BadRequest} from '../../../errors/BadRequest';

export class InvalidPlatformUpdates extends BadRequest {

  public constructor(message: string = 'Invalid platform updates') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

}