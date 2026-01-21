"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRecordsQueryJsonDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
const showOnlyForTableRecordsQueryJson = {
    operation: ['queryJson'],
    resource: ['tableRecords'],
};
exports.tableRecordsQueryJsonDescription = [
    {
        displayName: 'Table Name or ID',
        name: 'tableName',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getTables',
        },
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsQueryJson,
            },
        },
        default: '',
        required: true,
        description: 'Select the table to retrieve records from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
];
async function execute(index) {
    const tableName = this.getNodeParameter('tableName', index);
    const endpoint = `/api/modelinstance/${encodeURIComponent(tableName)}/json`;
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const responseBody = httpDetails.response.body;
    const items = Array.isArray(responseBody)
        ? responseBody
        : ((responseBody === null || responseBody === void 0 ? void 0 : responseBody.items) || (responseBody === null || responseBody === void 0 ? void 0 : responseBody.instances) || [responseBody]);
    if (isError) {
        const errorMessage = typeof responseBody === 'object' && responseBody !== null
            ? JSON.stringify(responseBody)
            : String(responseBody);
        throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
    }
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(items), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=queryJson.js.map