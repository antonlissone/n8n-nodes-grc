"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRecordsSaveXmlDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
const showOnlyForTableRecordsSaveXml = {
    operation: ['saveXml'],
    resource: ['tableRecords'],
};
exports.tableRecordsSaveXmlDescription = [
    {
        displayName: 'Table Name or ID',
        name: 'tableName',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getTables',
        },
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsSaveXml,
            },
        },
        default: '',
        required: true,
        description: 'Select the table to save records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
    {
        displayName: 'XML Data',
        name: 'xmlData',
        type: 'string',
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsSaveXml,
            },
        },
        default: '',
        required: true,
        typeOptions: {
            rows: 10,
        },
        description: 'XML data containing the records to save/update',
    },
];
async function execute(index) {
    const tableName = this.getNodeParameter('tableName', index);
    const xmlData = this.getNodeParameter('xmlData', index);
    const endpoint = `/api/instances?class=${encodeURIComponent(tableName)}`;
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'POST', endpoint, xmlData, {}, {
        json: false,
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/xml',
        },
    });
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const responseBody = httpDetails.response.body;
    if (isError) {
        const errorLog = await transport_1.SAI360GetLog.call(this);
        const errorDetail = typeof responseBody === 'string' ? responseBody : String(responseBody);
        throw new Error(`Request failed with status ${statusCode}:\n${errorDetail}\n\nAPI Log:\n${errorLog}`);
    }
    const output = [
        [
            {
                json: { xml: responseBody },
            },
        ],
    ];
    return output;
}
//# sourceMappingURL=saveXml.js.map