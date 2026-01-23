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
    {
        displayName: 'Response Format',
        name: 'responseFormat',
        type: 'options',
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsQueryXml,
            },
        },
        options: [
            {
                name: 'XML',
                value: 'xml',
            },
            {
                name: 'ZIP',
                value: 'zip',
            },
        ],
        default: 'xml',
        description: 'Format of the response data',
    },
    {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsQueryXml,
            },
        },
        default: '',
        placeholder: "label like '*'",
        description: "Filter expression (do NOT include class name). Examples: label like '*' | fieldId = 'Admin' | fieldId >= '2014-6-30' | fieldId like 'text1' OR fieldId like 'text2'. Use single quotes for values.",
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                ...showOnlyForTableRecordsQueryXml,
            },
        },
        options: [
            {
                displayName: 'Include Meta Info',
                name: 'metaInfo',
                type: 'boolean',
                default: false,
                description: 'Whether to include metadata information in the response',
            },
            {
                displayName: 'Include Subtypes',
                name: 'subTypes',
                type: 'boolean',
                default: false,
                description: 'Whether to include subtypes in the query results',
            },
            {
                displayName: 'Include Workflow',
                name: 'workflow',
                type: 'boolean',
                default: false,
                description: 'Whether to include workflow information in the response',
            },
            {
                displayName: 'Published Since',
                name: 'publishedSince',
                type: 'dateTime',
                default: '',
                description: 'Only return records published on or after this date (format: YYYYMMDD)',
            },
            {
                displayName: 'Reference Mode',
                name: 'refMode',
                type: 'options',
                options: [
                    {
                        name: 'GUID',
                        value: 'guid',
                    },
                    {
                        name: 'Label',
                        value: 'label',
                    },
                ],
                default: 'guid',
                description: 'How to reference related records in the response',
            },
        ],
    },
];
async function execute(index) {
    const tableName = this.getNodeParameter('tableName', index);
    const responseFormat = this.getNodeParameter('responseFormat', index);
    const query = this.getNodeParameter('query', index);
    const options = this.getNodeParameter('options', index);
    const refMode = options.refMode || 'guid';
    const subTypes = options.subTypes || false;
    const metaInfo = options.metaInfo || false;
    const workflow = options.workflow || false;
    const publishedSince = options.publishedSince || '';
    const queryParams = [];
    queryParams.push(`class=${encodeURIComponent(tableName)}`);
    queryParams.push(`refMode=${encodeURIComponent(refMode)}`);
    if (query) {
        const wrappedQuery = `${tableName}[${query}]`;
        queryParams.push(`query=${encodeURIComponent(wrappedQuery)}`);
    }
    if (subTypes) {
        queryParams.push('subTypes=true');
    }
    if (metaInfo) {
        queryParams.push('metaInfo=true');
    }
    if (workflow) {
        queryParams.push('workflow=true');
    }
    if (publishedSince) {
        const date = new Date(publishedSince);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}${month}${day}`;
        queryParams.push(`publishedSince=${formattedDate}`);
    }
    const endpoint = `/api/instances/?${queryParams.join('&')}`;
    const acceptHeader = responseFormat === 'zip' ? 'application/zip' : 'application/xml';
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', endpoint, {}, {}, {
        json: false,
        headers: {
            'Accept': acceptHeader,
        },
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
        {
            json: {},
            binary: undefined,
            pairedItem: { item: index },
        },
    ];
    if (responseFormat === 'zip' && responseBody) {
        const binaryData = await this.helpers.prepareBinaryData(Buffer.from(responseBody, 'binary'), `${tableName}.zip`, 'application/zip');
        output[0].binary = { data: binaryData };
        output[0].json = { format: 'zip', tableName };
    }
    else {
        output[0].json = { data: responseBody };
    }
    return output;
}
//# sourceMappingURL=queryXml.js.map