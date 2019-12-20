import {BadRequest} from '../../../errors/BadRequest';

export class InvalidObservation extends BadRequest {

  public constructor(message: string = 'Invalid observation') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

}