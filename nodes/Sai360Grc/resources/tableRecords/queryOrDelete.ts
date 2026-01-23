import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForTableRecordsQueryOrDelete = {
	operation: ['queryOrDelete'],
	resource: ['tableRecords'],
};

export const tableRecordsQueryOrDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Class Name or ID',
		name: 'className',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsQueryOrDelete,
			},
		},
		default: '',
		required: true,
		description: 'Select the class to query. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Action',
		name: 'queryAction',
		type: 'options',
		displayOptions: {
			show: {
				...showOnlyForTableRecordsQueryOrDelete,
			},
		},
		options: [
			{
				name: 'Get XML',
				value: 'xml',
				description: 'Retrieve query results as XML',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete the queried records',
			},
		],
		default: 'xml',

	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForTableRecordsQueryOrDelete,
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
				...showOnlyForTableRecordsQueryOrDelete,
			},
		},
		options: [
			{
				displayName: 'Follow References',
				name: 'followReferences',
				type: 'string',
				default: '',
				placeholder: 'field1,field2',
				description: 'Comma-separated list of reference fields to follow',
			},
			{
				displayName: 'Include Meta Info',
				name: 'metaInfo',
				type: 'boolean',
				default: false,
				description: 'Whether to include metadata information in the response (XML only)',
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
				description: 'Whether to include workflow information in the response (XML only)',
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

export async function execute(this: IExecuteFunctions, index: number) {
	// --- Get the parameters from node UI ---
	const className = this.getNodeParameter('className', index) as string;
	const queryAction = this.getNodeParameter('queryAction', index) as string;
	const query = this.getNodeParameter('query', index) as string;
	const options = this.getNodeParameter('options', index) as IDataObject;

	// Extract options
	const refMode = options.refMode as string || 'guid';
	const subTypes = options.subTypes as boolean || false;
	const followReferences = options.followReferences as string || '';
	const metaInfo = options.metaInfo as boolean || false;
	const workflow = options.workflow as boolean || false;

	// --- Step 1: POST to /api/instance/query to get queryId ---
	const postEndpoint = '/api/instances/query';

	// Build form data for the POST request
	const formData: IDataObject = {
		class: className,
		refMode: refMode,
	};

	// Wrap query with className[] format as expected by the API
	if (query) {
		formData.query = `${className}[${query}]`;
	}

	formData.subTypes = subTypes.toString();

	if (followReferences) {
		formData.followReferences = `${className}[${followReferences}]`;;
	}

	// Build URL-encoded body
	const formBody = Object.entries(formData)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');

	const postResponse = await SAI360ApiRequestWithDetails.call(
		this,
		'POST',
		postEndpoint,
		formBody,
		{},
		{
			json: false,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		}
	);
    
	// --- Check for HTTP errors on POST ---
	if (postResponse.response.isError) {
		const errorMessage = typeof postResponse.response.body === 'object' && postResponse.response.body !== null
			? JSON.stringify(postResponse.response.body)
			: String(postResponse.response.body);
		throw new Error(`POST request failed with status ${postResponse.response.statusCode}: ${errorMessage}`);
	}

	// --- Extract queryId from the response ---
	let queryId: number;
	const postBody = postResponse.response.body;

	if (typeof postBody === 'number') {
		queryId = postBody;
	} else {
		throw new Error('Unable to extract queryId from POST response');
	}

	// --- Step 2: GET or DELETE /api/instances/query/{queryId} ---
	let endpoint = `/api/instances/query/${encodeURIComponent(queryId)}`;
	const httpMethod = queryAction === 'delete' ? 'DELETE' : 'GET';

	// Add query parameters for metaInfo and workflow (only for GET/XML)
	if (queryAction === 'xml') {
		const queryParams: string[] = [];
		if (metaInfo) {
			queryParams.push('metaInfo=true');
		}
		if (workflow) {
			queryParams.push('workflow=true');
		}
		if (queryParams.length > 0) {
			endpoint += `?${queryParams.join('&')}`;
		}
	}

	const actionResponse = await SAI360ApiRequestWithDetails.call(
		this,
		httpMethod,
		endpoint,
		{},
		{},
		{ json: false }
	);

	// --- Check for HTTP errors ---
	if (actionResponse.response.isError) {
		const errorMessage = typeof actionResponse.response.body === 'object' && actionResponse.response.body !== null
			? JSON.stringify(actionResponse.response.body)
			: String(actionResponse.response.body);
		throw new Error(`${httpMethod} request failed with status ${actionResponse.response.statusCode}: ${errorMessage}`);
	}

	const output: INodeExecutionData[] = [
		{
			json: {},
			binary: undefined,
			pairedItem: { item: index },
		},
	];

	if (queryAction === 'delete') {
		output[0].json = {
			queryId: queryId,
			action: 'delete',
			success: true,
			message: actionResponse.response.body as string || 'Records deleted successfully',
		};
	} else {
		output[0].json = {
			queryId: queryId,
			data: actionResponse.response.body as IDataObject | string,
		};
	}

	return output;
}
