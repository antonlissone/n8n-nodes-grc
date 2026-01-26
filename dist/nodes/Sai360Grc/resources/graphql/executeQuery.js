"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlExecuteQueryDescription = void 0;
exports.extractVariablesFromQuery = extractVariablesFromQuery;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../../transport");
const showOnlyForGraphqlExecuteQuery = {
    operation: ['executeQuery'],
    resource: ['graphql'],
};
function extractVariablesFromQuery(query) {
    if (!query)
        return [];
    const variablePattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    const matches = query.matchAll(variablePattern);
    const variables = new Set();
    for (const match of matches) {
        variables.add(match[1]);
    }
    return Array.from(variables);
}
exports.graphqlExecuteQueryDescription = [
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
        placeholder: `query sdControlMeasureGet($id: ID!) {
    id
    name
    createdAt
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
        placeholder: '{ "ID": "123" }',
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
];
async function execute(index) {
    const query = this.getNodeParameter('query', index);
    const variablesMode = this.getNodeParameter('variablesMode', index);
    if (!query || query.trim() === '') {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'GraphQL query cannot be empty', { itemIndex: index });
    }
    let variables = {};
    if (variablesMode === 'json') {
        const variablesJson = this.getNodeParameter('variablesJson', index, '{}');
        if (typeof variablesJson === 'string') {
            try {
                variables = JSON.parse(variablesJson || '{}');
            }
            catch (error) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to parse variables JSON: ${error instanceof Error ? error.message : String(error)}`, { itemIndex: index });
            }
        }
        else if (typeof variablesJson === 'object' && variablesJson !== null) {
            variables = variablesJson;
        }
    }
    else {
        const variablesUi = this.getNodeParameter('variablesUi', index, {});
        const variableItems = variablesUi.variable || [];
        for (const item of variableItems) {
            const name = item.name;
            const value = item.value;
            if (name && name.trim() !== '') {
                try {
                    variables[name] = JSON.parse(value);
                }
                catch {
                    variables[name] = value;
                }
            }
        }
    }
    const requestBody = {
        query: query.trim(),
    };
    if (Object.keys(variables).length > 0) {
        requestBody.variables = variables;
    }
    const response = await transport_1.SAI360ApiRequestWithDetails.call(this, 'POST', '/api/graphql', requestBody, {}, {
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (response.response.isError) {
        const errorBody = response.response.body;
        const errorMessage = typeof errorBody === 'object' && errorBody !== null
            ? JSON.stringify(errorBody)
            : String(errorBody);
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL request failed with status ${response.response.statusCode}: ${errorMessage}`, { itemIndex: index });
    }
    const graphqlResponse = response.response.body;
    if (graphqlResponse.errors && Array.isArray(graphqlResponse.errors)) {
        const errors = graphqlResponse.errors;
        const errorMessages = errors.map((e) => e.message || JSON.stringify(e)).join('; ');
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL query returned errors: ${errorMessages}`, { itemIndex: index });
    }
    const result = graphqlResponse.data || {};
    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(result), { itemData: { item: index } });
    return executionData;
}
//# sourceMappingURL=executeQuery.js.map