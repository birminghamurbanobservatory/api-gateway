"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequest_1 = require("./BadRequest");
class InvalidBody extends BadRequest_1.BadRequest {
    constructor(message = 'Invalid body') {
        super(message); // 'Error' breaks prototype chain here
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain      
    }
}
exports.InvalidBody = InvalidBody;
//# sourceMappingURL=InvalidBody.js.map