import {BadRequest} from '../../../errors/BadRequest';

export class InvalidFeatureOfInterest extends BadRequest {

  public constructor(message: string = 'Invalid feature of interest') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

}