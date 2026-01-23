import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

const showOnlyForTableRecordsMapJson = {
	operation: ['mapJson'],
	resource: ['tableRecords'],
};

export const tableRecordsMapJsonDescription: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'tableName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsMapJson,
			},
		},
		default: '',
		required: true,
		description:
			'Select the table to map records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Field to Use for Lookup Name or ID',
		name: 'lookupField',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTableFieldsForLookup',
			loadOptionsDependsOn: ['tableName'],
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsMapJson,
			},
		},
		default: '',
		required: true,
		description:
			'Field to use for lookup of existing records (for create or update). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Field Mapping',
		name: 'fieldMapping',
		type: 'resourceMapper',
		noDataExpression: true,
		displayOptions: {
			show: {
				...showOnlyForTableRecordsMapJson,
			},
		},
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		required: true,
		typeOptions: {
			loadOptionsDependsOn: ['tableName', 'lookupField'],
			resourceMapper: {
				resourceMapperMethod: 'getTableAttributes',
				mode: 'add',
				fieldWords: {
					singular: 'field',
					plural: 'fields',
				},
				addAllFields: false,
				multiKeyMatch: false,
			},
		},
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	// --- Get the parameters from node UI ---
	const fieldMapping = this.getNodeParameter('fieldMapping', index) as IDataObject;
	const lookupField = this.getNodeParameter('lookupField', index) as string;

	// Extract mapped values from resourceMapper
	const mappedValues = fieldMapping.value as IDataObject;

	if (!mappedValues || Object.keys(mappedValues).length === 0) {
		throw new Error('No fields mapped. Please map at least one field.');
	}

	// --- Validate lookup field is mapped ---
	const mappedFieldNames = Object.keys(mappedValues).filter(
		(key) =>
			mappedValues[key] !== undefined &&
			mappedValues[key] !== null &&
			mappedValues[key] !== '',
	);

	if (lookupField === 'uuid') {
		// If using uuid, either the uuid or __uuid field must be mapped
		if (!mappedFieldNames.includes('uuid') && !mappedFieldNames.includes('__uuid')) {
			throw new Error(
				'When using "uuid" for lookup, either the "uuid" or "__uuid" field must be mapped.',
			);
		}
	} else {
		// Otherwise, the selected lookup field must be mapped
		if (!mappedFieldNames.includes(lookupField)) {
			throw new Error(
				`The lookup field "${lookupField}" must be included in the field mapping.`,
			);
		}
	}

	// Build the record from mapped values
	const record: IDataObject = {
		__lookupBy: lookupField,
	};

	// Check if uuid or __uuid is mapped
	const hasUuidMapping = mappedFieldNames.includes('uuid');
	const hasDirectUuidMapping = mappedFieldNames.includes('__uuid');

	// Set __uuid from either source (prefer __uuid if both are mapped)
	if (hasDirectUuidMapping) {
		record.__uuid = mappedValues.__uuid;
	} else if (hasUuidMapping) {
		record.__uuid = mappedValues.uuid;
	}

	for (const [fieldName, value] of Object.entries(mappedValues)) {
		if (value !== undefined && value !== null && value !== '') {
			// Skip uuid field if we're outputting __uuid instead
			if (fieldName === 'uuid' && hasUuidMapping) {
				continue;
			}
			// Skip __uuid as it's already handled above
			if (fieldName === '__uuid') {
				continue;
			}
			record[fieldName] = value;
		}
	}

	// --- Return the transformed JSON (no API call) ---
	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray([record]),
		{ itemData: { item: index } },
	);

	return executionData;
}
