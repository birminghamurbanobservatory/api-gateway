"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
exports.RootRouter = router;
//-------------------------------------------------
// Get
//-------------------------------------------------
router.get('/', (req, res) => {
    return res.send('Welcome to the API Gateway.');
});
//# sourceMappingURL=root.js.map