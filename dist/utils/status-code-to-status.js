"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dict = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    410: 'Gone',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
};
function statusCodeToStatus(statusCode) {
    return dict[statusCode];
}
exports.statusCodeToStatus = statusCodeToStatus;
//# sourceMappingURL=status-code-to-status.js.map