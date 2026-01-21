"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionGetLogDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport/");
exports.sessionGetLogDescription = [];
async function execute(index) {
    const endpoint = '/api/log';
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', endpoint, {}, {}, {
        headers: { Accept: 'text/plain' },
    });
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const responseBody = httpDetails.response.body;
    if (isError) {
        const errorMessage = typeof responseBody === 'object' && responseBody !== null
            ? JSON.stringify(responseBody)
            : String(responseBody);
        throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
    }
    const output = [
        [
            {
                json: { log: responseBody },
            },
        ],
    ];
    return output;
}
//# sourceMappingURL=getLog.js.map