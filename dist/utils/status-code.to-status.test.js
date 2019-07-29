"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const status_code_to_status_1 = require("./status-code-to-status");
//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('statusCodeToStatus function testing', () => {
    test('Returns expected response for valid statusCode', () => {
        expect(status_code_to_status_1.statusCodeToStatus(404)).toBe('Not Found');
    });
    test('Returns undefined when given an statusCode that is not in the dictionary', () => {
        expect(status_code_to_status_1.statusCodeToStatus(999)).toBe(undefined);
    });
});
//# sourceMappingURL=status-code.to-status.test.js.map