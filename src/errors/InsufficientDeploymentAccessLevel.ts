import {Forbidden} from './Forbidden';

export class InsufficientDeploymentAccessLevel extends Forbidden {

  public constructor(message: string = 'You have an insufficient access level to the deployment to perform this action.') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain      
  }

}