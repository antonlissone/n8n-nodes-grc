"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionGetVersionInfoDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
exports.sessionGetVersionInfoDescription = [];
async function execute(index) {
    const endpoint = '/versioninfo';
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);
    const response = httpDetails.response.body;
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const text = typeof response === 'string'
        ? response.replace(/<[^>]*>/g, '').trim()
        : JSON.stringify(response);
    if (isError) {
        throw new Error(`Request failed with status ${statusCode}: ${text}`);
    }
    const output = [
        [
            {
                json: { versionInfo: text },
            },
        ],
    ];
    return output;
}
//# sourceMappingURL=getVersionInfo.js.map