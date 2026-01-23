"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sai360Grc = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const datastore_1 = require("./resources/datastore");
const tableRecords_1 = require("./resources/tableRecords");
const session_1 = require("./resources/session");
const workflow_1 = require("./resources/workflow");
const router_1 = require("./router");
const transport_1 = require("../../transport");
class Sai360Grc {
    constructor() {
        this.description = {
            displayName: 'SAI360 GRC',
            name: 'sai360Grc',
            icon: { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' },
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with the SAI360 GRC API',
            defaults: {
                name: 'SAI360 GRC',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [{
                    name: 'sai360GrcOAuth2Api', required: false, displayOptions: {
                        show: {
                            authentication: ['basic'],
                        },
                    }
                }, {
                    name: 'sai360GrcBasicApi', required: false, displayOptions: {
                        show: {
                            authentication: ['oauth2'],
                        },
                    }
                }],
            properties: [
                {
                    displayName: 'Authentication',
                    name: 'authentication',
                    type: 'options',
                    options: [
                        { name: 'Basic Auth', value: 'basic' },
                        { name: 'OAuth2', value: 'oauth2' },
                    ],
                    default: 'oauth2',
                    description: 'The authentication method to use',
                    typeOptions: { hidden: true },
                },
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Datastore',
                            value: 'datastore',
                        },
                        {
                            name: 'Table Record',
                            value: 'tableRecords',
                        },
                        {
                            name: 'Workflow',
                            value: 'workflow',
                        },
                        {
                            name: 'Session',
                            value: 'session',
                        },
                    ],
                    default: 'datastore',
                },
                ...tableRecords_1.tableRecordsDescription,
                ...workflow_1.workflowDescription,
                ...datastore_1.datastoreDescription,
                ...session_1.sessionDescription,
            ],
        };
        this.methods = {
            loadOptions: {
                async getDatastores() {
                    const response = await transport_1.SAI360ApiRequest.call(this, 'GET', '/api/datastoreservice/datastores');
                    if (!(response === null || response === void 0 ? void 0 : response.entries)) {
                        return [];
                    }
                    return response.entries.map((ds) => ({
                        name: `${ds.label} (${ds.identifier})`,
                        value: ds.identifier,
                        description: `Type: ${ds.type} | ID: ${ds.objectId}`,
                    }));
                },
                async getTables() {
                    const response = await transport_1.SAI360ApiRequest.call(this, 'GET', '/api/datamodel/classes');
                    let tables = [];
                    if (Array.isArray(response)) {
                        tables = response;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.classes) {
                        tables = response.classes;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.items) {
                        tables = response.items;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.entries) {
                        tables = response.entries;
                    }
                    if (!tables.length) {
                        return [];
                    }
                    return tables.map((tbl) => ({
                        name: `${tbl.label || tbl.name} (${tbl.name})`,
                        value: tbl.name,
                        description: tbl.description || '',
                    }));
                },
                async getTableFieldsForLookup() {
                    const tableName = this.getNodeParameter('tableName', 0);
                    const options = [
                        {
                            name: 'Uuid',
                            value: 'uuid',
                            description: 'Use the unique identifier (uuid) for lookup',
                        },
                    ];
                    if (!tableName) {
                        return options;
                    }
                    try {
                        const response = (await transport_1.SAI360ApiRequest.call(this, 'GET', `/api/datamodel/class/${encodeURIComponent(tableName)}`));
                        let attributes = [];
                        if (Array.isArray(response)) {
                            attributes = response;
                        }
                        else if (response === null || response === void 0 ? void 0 : response.attributes) {
                            attributes = response.attributes;
                        }
                        else if (response === null || response === void 0 ? void 0 : response.fields) {
                            attributes = response.fields;
                        }
                        else if (response === null || response === void 0 ? void 0 : response.properties) {
                            attributes = response.properties;
                        }
                        for (const attr of attributes) {
                            if (attr.name !== 'uuid') {
                                options.push({
                                    name: attr.label || attr.name,
                                    value: attr.name,
                                    description: attr.description || `Field: ${attr.name}`,
                                });
                            }
                        }
                    }
                    catch {
                    }
                    return options;
                },
            },
            resourceMapping: {
                async getTableAttributes() {
                    const tableName = this.getNodeParameter('tableName', 0);
                    if (!tableName) {
                        return { fields: [] };
                    }
                    const response = (await transport_1.SAI360ApiRequest.call(this, 'GET', `/api/datamodel/class/${encodeURIComponent(tableName)}`));
                    let attributes = [];
                    if (Array.isArray(response)) {
                        attributes = response;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.attributes) {
                        attributes = response.attributes;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.fields) {
                        attributes = response.fields;
                    }
                    else if (response === null || response === void 0 ? void 0 : response.properties) {
                        attributes = response.properties;
                    }
                    const mapType = (saiType) => {
                        if (!saiType)
                            return 'string';
                        const lower = saiType.toLowerCase();
                        if (lower.includes('int') || lower.includes('number') || lower.includes('decimal') || lower.includes('float') || lower.includes('double')) {
                            return 'number';
                        }
                        if (lower.includes('bool')) {
                            return 'boolean';
                        }
                        if (lower.includes('date') || lower.includes('time')) {
                            return 'dateTime';
                        }
                        return 'string';
                    };
                    const fields = [
                        {
                            id: '__uuid',
                            displayName: '__uuid (Direct UUID)',
                            required: false,
                            defaultMatch: false,
                            canBeUsedToMatch: true,
                            display: true,
                            type: 'string',
                            readOnly: false,
                        },
                        ...attributes.map((attr) => ({
                            id: attr.name,
                            displayName: attr.label || attr.name,
                            required: attr.required || false,
                            defaultMatch: attr.name === 'guid' || attr.name === 'id',
                            canBeUsedToMatch: true,
                            display: true,
                            type: mapType(attr.type),
                            readOnly: attr.readOnly || false,
                        })),
                    ];
                    return { fields };
                },
            },
        };
    }
    async execute() {
        return await router_1.router.call(this);
    }
}
exports.Sai360Grc = Sai360Grc;
//# sourceMappingURL=Sai360Grc.node.js.map