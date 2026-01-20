"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionGetVersionInfoDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
exports.sessionGetVersionInfoDescription = [];
async function execute(_index) {
    const endpoint = '/versioninfo';
    const response = await transport_1.SAI360ApiRequest.call(this, 'GET', endpoint);
    const text = typeof response === 'string'
        ? response.replace(/<[^>]*>/g, '').trim()
        : JSON.stringify(response);
    const output = [
        [
            {
                json: { text },
            },
        ],
    ];
    return output;
}
//# sourceMappingURL=getVersionInfo.js.map