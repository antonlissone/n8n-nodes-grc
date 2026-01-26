import type { AllEntities } from 'n8n-workflow';
type NodeMap = {
    tableRecords: 'queryJson' | 'queryXml' | 'saveJson' | 'saveXml';
    datastore: 'primeForPagination' | 'directExecute';
    workflow: 'move';
    session: 'getLog' | 'logout';
    graphql: 'executeQuery';
};
export type SAI360 = AllEntities<NodeMap>;
export {};
