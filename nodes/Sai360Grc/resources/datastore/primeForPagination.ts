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
		description: 'Datastore identifier to prime for execution (paginated)',
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	const datastoreId = this.getNodeParameter('datastoreId', index) as string;

	const endpoint = '/api/griddata/query/datastore!' + encodeURIComponent(datastoreId);

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'POST', endpoint);
	const responseBody = httpDetails.response.body;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray([responseBody as IDataObject]),
		{ itemData: { item: index } },
	);

	return executionData;
}

