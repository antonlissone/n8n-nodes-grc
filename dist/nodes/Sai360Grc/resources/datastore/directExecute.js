"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datastoreDirectExecuteDescription = void 0;
exports.execute = execute;
const transport_1 = require("../../../../transport");
const showOnlyForDatastoreDirectExecute = {
    operation: ['directExecute'],
    resource: ['datastore'],
};
exports.datastoreDirectExecuteDescription = [
    {
        displayName: 'Datastore Name or ID',
        name: 'datastoreId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getDatastores',
        },
        displayOptions: {
            show: {
                ...showOnlyForDatastoreDirectExecute,
            },
        },
        default: '',
        required: true,
        description: 'Select the datastore to execute and retrieve results from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
];
async function execute(index) {
    const datastoreId = this.getNodeParameter('datastoreId', index);
    const queryEndpoint = `/api/griddata/query/datastore!${encodeURIComponent(datastoreId)}`;
    const queryDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'POST', queryEndpoint);
    if (queryDetails.response.isError) {
        const errorBody = queryDetails.response.body;
        const errorMessage = typeof errorBody === 'object' && errorBody !== null
            ? JSON.stringify(errorBody)
            : String(errorBody);
        throw new Error(`Query failed with status ${queryDetails.response.statusCode}: ${errorMessage}`);
    }
    const queryResponse = queryDetails.response.body;
    if (!queryResponse || !queryResponse.id) {
        throw new Error(`Failed to get griddata ID for datastore ${datastoreId}`);
    }
    const gridDataId = queryResponse.id;
    const itemsEndpoint = `/api/griddata/items/${gridDataId}?start=0&limit=10000`;
    const itemsDetails = await transport_1.SAI360ApiRequestWithDetails.call(this, 'GET', itemsEndpoint);
    if (itemsDetails.response.isError) {
        const errorBody = itemsDetails.response.body;
        const errorMessage = typeof errorBody === 'object' && errorBody !== null
            ? JSON.stringify(errorBody)
            : String(errorBody);
        throw new Error(`Fetch items failed with status ${itemsDetails.response.statusCode}: ${errorMessage}`);
    }
    const itemsResponse = itemsDetails.response.body;
    const items = Array.isArray(itemsResponse) ? itemsResponse : [itemsResponse];
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(items), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=directExecute.js.map