import type { AllEntities } from 'n8n-workflow';
type NodeMap = {
    datastore: 'primeForPagination';
    workflow: 'move';
    session: 'getLog' | 'logout';
};
export type SAI360 = AllEntities<NodeMap>;
export {};
