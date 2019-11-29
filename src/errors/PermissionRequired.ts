import {Forbidden} from './Forbidden';

export class PermissionRequired extends Forbidden {

  public constructor(message = 'You do not have the required permission to make this request.') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain     
  }

}