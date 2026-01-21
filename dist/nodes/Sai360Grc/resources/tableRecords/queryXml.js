"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRecordsQueryXmlDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
const showOnlyForTableRecordsQueryXml = {
    operation: ['queryXml'],
    resource: ['tableRecords'],
};
exports.tableRecordsQueryXmlDescription = [
    {
        displayName: 'Table Name or ID',
        name: 'tableName',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getTables',
        },
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsQueryXml,
            },
        },
        default: '',
        required: true,
        description: 'Select the table to retrieve records from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
];
async function execute(index) {
    const tableName = this.getNodeParameter('tableName', index);
    const endpoint = `/api/instances/?class=${encodeURIComponent(tableName)}`;
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', endpoint, {}, {}, { json: false });
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
        {
            json: {},
            binary: undefined,
            pairedItem: { item: index },
        },
    ];
    output[0].json = { data: responseBody };
    return output;
}
//# sourceMappingURL=queryXml.js.map