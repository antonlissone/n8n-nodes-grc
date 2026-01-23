"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRecordsMapJsonDescription = void 0;
exports.execute = execute;
const showOnlyForTableRecordsMapJson = {
    operation: ['mapJson'],
    resource: ['tableRecords'],
};
exports.tableRecordsMapJsonDescription = [
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
        description: 'Select the table to map records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
        description: 'Field to use for lookup of existing records (for create or update). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
async function execute(index) {
    const fieldMapping = this.getNodeParameter('fieldMapping', index);
    const lookupField = this.getNodeParameter('lookupField', index);
    const mappedValues = fieldMapping.value;
    if (!mappedValues || Object.keys(mappedValues).length === 0) {
        throw new Error('No fields mapped. Please map at least one field.');
    }
    const mappedFieldNames = Object.keys(mappedValues).filter((key) => mappedValues[key] !== undefined &&
        mappedValues[key] !== null &&
        mappedValues[key] !== '');
    if (lookupField === 'uuid') {
        if (!mappedFieldNames.includes('uuid') && !mappedFieldNames.includes('__uuid')) {
            throw new Error('When using "uuid" for lookup, either the "uuid" or "__uuid" field must be mapped.');
        }
    }
    else {
        if (!mappedFieldNames.includes(lookupField)) {
            throw new Error(`The lookup field "${lookupField}" must be included in the field mapping.`);
        }
    }
    const record = {
        __lookupBy: lookupField,
    };
    const hasUuidMapping = mappedFieldNames.includes('uuid');
    const hasDirectUuidMapping = mappedFieldNames.includes('__uuid');
    if (hasDirectUuidMapping) {
        record.__uuid = mappedValues.__uuid;
    }
    else if (hasUuidMapping) {
        record.__uuid = mappedValues.uuid;
    }
    for (const [fieldName, value] of Object.entries(mappedValues)) {
        if (value !== undefined && value !== null && value !== '') {
            if (fieldName === 'uuid' && hasUuidMapping) {
                continue;
            }
            if (fieldName === '__uuid') {
                continue;
            }
            record[fieldName] = value;
        }
    }
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray([record]), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=mapJson.js.map