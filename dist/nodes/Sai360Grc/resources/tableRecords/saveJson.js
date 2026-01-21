"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRecordsSaveJsonDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
const showOnlyForTableRecordsSaveJson = {
    operation: ['saveJson'],
    resource: ['tableRecords'],
};
exports.tableRecordsSaveJsonDescription = [
    {
        displayName: 'Table Name or ID',
        name: 'tableName',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getTables',
        },
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsSaveJson,
            },
        },
        default: '',
        required: true,
        description: 'Select the table to save records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
    {
        displayName: 'Records',
        name: 'records',
        type: 'json',
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsSaveJson,
            },
        },
        default: '[]',
        required: true,
        description: 'JSON array of records to save/update',
    },
    {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsSaveJson,
            },
        },
        default: 0,
        description: 'Number of records per batch. Set to 0 for all-or-nothing (no batching).',
        typeOptions: {
            minValue: 0,
        },
    },
];
async function execute(index) {
    const tableName = this.getNodeParameter('tableName', index);
    const recordsJson = this.getNodeParameter('records', index);
    const batchSize = this.getNodeParameter('batchSize', index);
    let records;
    try {
        records = JSON.parse(recordsJson);
        if (!Array.isArray(records)) {
            records = [records];
        }
    }
    catch (e) {
        throw new Error('Invalid JSON in Records field');
    }
    let endpoint = `/api/modelinstance/${encodeURIComponent(tableName)}/json`;
    if (batchSize > 0) {
        endpoint += `?batchsize=${batchSize}`;
    }
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'POST', endpoint, records);
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const responseBody = httpDetails.response.body;
    const result = Array.isArray(responseBody) ? responseBody : [responseBody];
    const parseSai360Messages = (body) => {
        if (!body || typeof body !== 'object')
            return '';
        const saiResponse = body;
        const messages = [];
        const messageTypes = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
        for (const type of messageTypes) {
            const typeMessages = saiResponse[type];
            if (typeMessages && Array.isArray(typeMessages) && typeMessages.length > 0) {
                messages.push(`${type}: ${typeMessages.join('; ')}`);
            }
        }
        return messages.join('\n');
    };
    if (isError) {
        const saiMessages = parseSai360Messages(responseBody);
        const errorDetail = saiMessages || (typeof responseBody === 'object' && responseBody !== null
            ? JSON.stringify(responseBody)
            : String(responseBody));
        throw new Error(`Request failed with status ${statusCode}:\n${errorDetail}`);
    }
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(result), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=saveJson.js.map