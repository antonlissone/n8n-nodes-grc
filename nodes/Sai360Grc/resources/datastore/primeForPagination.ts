import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport/'

const showOnlyForDatastorePrimeForPagination = {
	operation: ['primeForPagination'],
	resource: ['datastore'],
};

export const datastorePrimeForPaginationDescription: INodeProperties[] = [
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

export async function execute(this: IExecuteFunctions, index: number) {
	const datastoreId = this.getNodeParameter('datastoreId', index) as string;

	const endpoint = '/api/griddata/query/datastore!' + encodeURIComponent(datastoreId);

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'POST', endpoint);

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Handle errors ---
	if (isError) {
		const errorMessage = typeof responseBody === 'object' && responseBody !== null
			? JSON.stringify(responseBody)
			: String(responseBody);
		throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
	}

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray([responseBody as IDataObject]),
		{ itemData: { item: index } },
	);

	return executionData;
}

