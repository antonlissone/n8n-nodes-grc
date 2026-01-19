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
        displayName: 'Datastore Id',
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
    const responseData = await transport_1.SAI360ApiRequest.call(this, 'POST', endpoint);
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=primeForPagination.js.map