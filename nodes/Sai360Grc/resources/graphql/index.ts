import type { INodeProperties } from 'n8n-workflow';
import * as executeQuery from './executeQuery';

const showOnlyForGraphql = {
	resource: ['graphql'],
};

export { executeQuery };

export const graphqlDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForGraphql,
		},
		options: [
			{
				name: 'Execute Query',
				value: 'executeQuery',
				action: 'Execute a graph ql query',
				description: 'Execute a GraphQL query against the SAI360 API',
			},
		],
		default: 'executeQuery',
	},
	...executeQuery.graphqlExecuteQueryDescription,
];
