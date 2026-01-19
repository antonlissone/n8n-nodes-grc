"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionGetLogDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport/");
exports.sessionGetLogDescription = [];
async function execute(index) {
    const endpoint = '/api/log';
    const response = await transport_1.SAI360ApiRequest.call(this, 'GET', endpoint, undefined, {
        Accept: 'text/plain',
    });
    const output = [
        [
            {
                json: { response },
            },
        ],
    ];
    return output;
}
//# sourceMappingURL=getLog.js.map