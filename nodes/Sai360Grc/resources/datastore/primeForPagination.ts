import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequest } from '../../../../transport/'

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

	const responseData = await SAI360ApiRequest.call(this, 'POST', endpoint);

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(responseData as IDataObject),
		{ itemData: { item: index } },
	);

	return executionData;
}

