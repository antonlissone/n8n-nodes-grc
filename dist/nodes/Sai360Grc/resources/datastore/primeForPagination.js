"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datastorePrimeForPaginationDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport/");
const showOnlyForDatastorePrimeForPagination = {
    operation: ['primeForPagination'],
    resource: ['datastore'],
};
exports.datastorePrimeForPaginationDescription = [
    {
        displayName: 'Datastore ID',
        name: 'datastoreId',
        type: 'string',
        displayOptions: {
            show: {
                ...showOnlyForDatastorePrimeForPagination,
            },
        },
        default: '',
        required: true,
        placeholder: 'Solutions_COI_Disclosures',
        description: 'Datastore Identifier to prime for execution (paginated)',
    },
];
async function execute(index) {
    const datastoreId = this.getNodeParameter('datastoreId', index);
    const endpoint = '/api/griddata/query/datastore!' + encodeURIComponent(datastoreId);
    const httpDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'POST', endpoint);
    const isError = httpDetails.response.isError || false;
    const statusCode = httpDetails.response.statusCode || 0;
    const responseBody = httpDetails.response.body;
    if (isError) {
        const errorMessage = typeof responseBody === 'object' && responseBody !== null
            ? JSON.stringify(responseBody)
            : String(responseBody);
        throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
    }
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray([responseBody]), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=primeForPagination.js.map