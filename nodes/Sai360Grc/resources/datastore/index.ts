import type { INodeProperties } from 'n8n-workflow';
import * as primeForPagination from './primeForPagination';
import * as directExecute from './directExecute';

const showOnlyForDatastore = {
	resource: ['datastore'],
};

export { primeForPagination, directExecute}

export const datastoreDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDatastore,
		},
		options: [
			{
				name: 'Prime for Execution (Paginated)',
				value: 'primeForPagination',
				action: 'Prime for execution',
				description: 'Prime datastore for execution (paginated)',
			},
			{
				name: 'Direct Execute',
				value: 'directExecute',
				action: 'Direct execute',
				description: 'Directly execute datastore query and retrieve results',
			},
		],
		default: 'directExecute',
	},
	...primeForPagination.datastorePrimeForPaginationDescription,
	...directExecute.datastoreDirectExecuteDescription,
];
