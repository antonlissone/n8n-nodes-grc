import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForGraphqlExecuteQuery = {
	operation: ['executeQuery'],
	resource: ['graphql'],
};

/**
 * Extracts variable names from a GraphQL query string.
 * Looks for $variableName patterns in the query.
 * @param query - The GraphQL query string
 * @returns Array of unique variable names (without the $ prefix)
 */
export function extractVariablesFromQuery(query: string): string[] {
	if (!query) return [];

	// Match $variableName patterns - variable names can contain letters, numbers, and underscores
	// but must start with a letter or underscore
	const variablePattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
	const matches = query.matchAll(variablePattern);

	// Extract unique variable names
	const variables = new Set<string>();
	for (const match of matches) {
		variables.add(match[1]);
	}

	return Array.from(variables);
}

export const graphqlExecuteQueryDescription: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		displayOptions: {
			show: showOnlyForGraphqlExecuteQuery,
		},
		default: '',
		required: true,
		description: 'The GraphQL query to execute. Variables should be prefixed with $ (e.g., $ID, $filter).',
		typeOptions: {
			rows: 10,
		},
		placeholder: `query GetRecord($id: ID!) {
  record(id: $id) {
    id
    name
    createdAt
  }
}`,
	},
	{
		displayName: 'Variables Mode',
		name: 'variablesMode',
		type: 'options',
		displayOptions: {
			show: showOnlyForGraphqlExecuteQuery,
		},
		options: [
			{
				name: 'Define Below',
				value: 'auto',
				description: 'Define variables using the fields below',
			},
			{
				name: 'JSON Input',
				value: 'json',
				description: 'Provide variables as a JSON object',
			},
		],
		default: 'auto',
		description: 'How to provide variables for the GraphQL query',
	},
	{
		displayName: 'Variables (JSON)',
		name: 'variablesJson',
		type: 'json',
		displayOptions: {
			show: {
				...showOnlyForGraphqlExecuteQuery,
				variablesMode: ['json'],
			},
		},
		default: '{}',
		description: 'Variables to pass to the GraphQL query as a JSON object',
		typeOptions: {
			alwaysOpenEditWindow: false,
			rows: 5,
		},
		placeholder: '{ "ID": "123", "filter": "active" }',
	},
	{
		displayName: 'Query Variables',
		name: 'variablesUi',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				...showOnlyForGraphqlExecuteQuery,
				variablesMode: ['auto'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Variable',
		description: 'Add values for variables used in your query (e.g., $ID, $filter). Variable names should match those in your query without the $ prefix.',
		options: [
			{
				name: 'variable',
				displayName: 'Variable',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Variable name (without the $ prefix)',
						placeholder: 'ID',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value for this variable. Use expressions to reference data from previous nodes.',
					},
				],
			},
		],
	},
	{
		displayName: 'Operation Name',
		name: 'operationName',
		type: 'string',
		displayOptions: {
			show: showOnlyForGraphqlExecuteQuery,
		},
		default: '',
		description: 'Name of the GraphQL operation to execute (optional, required if query contains multiple operations)',
		placeholder: 'GetRecord',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: showOnlyForGraphqlExecuteQuery,
		},
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Include Extensions',
				name: 'includeExtensions',
				type: 'boolean',
				default: false,
				description: 'Whether to include the extensions field from the GraphQL response',
			},
			{
				displayName: 'Return Full Response',
				name: 'returnFullResponse',
				type: 'boolean',
				default: false,
				description: 'Whether to return the full GraphQL response including data, errors, and extensions',
			},
		],
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	// Get parameters
	const query = this.getNodeParameter('query', index) as string;
	const variablesMode = this.getNodeParameter('variablesMode', index) as string;
	const operationName = this.getNodeParameter('operationName', index, '') as string;
	const options = this.getNodeParameter('options', index, {}) as IDataObject;

	if (!query || query.trim() === '') {
		throw new NodeOperationError(this.getNode(), 'GraphQL query cannot be empty', { itemIndex: index });
	}

	// Build variables object based on mode
	let variables: IDataObject = {};

	if (variablesMode === 'json') {
		const variablesJson = this.getNodeParameter('variablesJson', index, '{}') as string | IDataObject;

		if (typeof variablesJson === 'string') {
			try {
				variables = JSON.parse(variablesJson || '{}') as IDataObject;
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to parse variables JSON: ${error instanceof Error ? error.message : String(error)}`,
					{ itemIndex: index },
				);
			}
		} else if (typeof variablesJson === 'object' && variablesJson !== null) {
			variables = variablesJson;
		}
	} else {
		// Auto mode - get variables from UI collection
		const variablesUi = this.getNodeParameter('variablesUi', index, {}) as IDataObject;
		const variableItems = (variablesUi.variable as IDataObject[]) || [];

		for (const item of variableItems) {
			const name = item.name as string;
			const value = item.value as string;

			if (name && name.trim() !== '') {
				// Try to parse the value as JSON (for objects, arrays, numbers, booleans)
				// If that fails, use as string
				try {
					variables[name] = JSON.parse(value);
				} catch {
					variables[name] = value;
				}
			}
		}
	}

	// Build GraphQL request body
	const requestBody: IDataObject = {
		query: query.trim(),
	};

	// Only add variables if not empty
	if (Object.keys(variables).length > 0) {
		requestBody.variables = variables;
	}

	// Only add operationName if provided
	if (operationName && operationName.trim() !== '') {
		requestBody.operationName = operationName.trim();
	}

	// Make the GraphQL request
	const response = await SAI360ApiRequestWithDetails.call(
		this,
		'POST',
		'/api/graphql',
		requestBody,
		{},
		{
			json: true,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);

	// Check for HTTP errors
	if (response.response.isError) {
		const errorBody = response.response.body;
		const errorMessage = typeof errorBody === 'object' && errorBody !== null
			? JSON.stringify(errorBody)
			: String(errorBody);
		throw new NodeOperationError(
			this.getNode(),
			`GraphQL request failed with status ${response.response.statusCode}: ${errorMessage}`,
			{ itemIndex: index },
		);
	}

	const graphqlResponse = response.response.body as IDataObject;

	// Check for GraphQL errors
	if (graphqlResponse.errors && Array.isArray(graphqlResponse.errors)) {
		const errors = graphqlResponse.errors as IDataObject[];
		const errorMessages = errors.map((e) => e.message || JSON.stringify(e)).join('; ');

		// If returnFullResponse is enabled, don't throw but include errors in response
		if (!options.returnFullResponse) {
			throw new NodeOperationError(
				this.getNode(),
				`GraphQL query returned errors: ${errorMessages}`,
				{ itemIndex: index },
			);
		}
	}

	// Determine what to return
	let result: IDataObject;

	if (options.returnFullResponse) {
		// Return the full GraphQL response
		result = graphqlResponse;
	} else {
		// Return just the data portion
		result = (graphqlResponse.data as IDataObject) || {};

		// Optionally include extensions
		if (options.includeExtensions && graphqlResponse.extensions) {
			result._extensions = graphqlResponse.extensions;
		}
	}

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(result),
		{ itemData: { item: index } },
	);

	return executionData;
}
