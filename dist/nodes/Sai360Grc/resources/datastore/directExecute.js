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
    const queryResponse = await transport_1.SAI360ApiRequest.call(this, 'POST', queryEndpoint);
    if (!queryResponse || !queryResponse.id) {
        throw new Error(`Failed to get griddata ID for datastore ${datastoreId}`);
    }
    const gridDataId = queryResponse.id;
    const itemsEndpoint = `/api/griddata/items/${gridDataId}?start=0&limit=10000`;
    const itemsResponse = await transport_1.SAI360ApiRequest.call(this, 'GET', itemsEndpoint);
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(itemsResponse), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=directExecute.js.map