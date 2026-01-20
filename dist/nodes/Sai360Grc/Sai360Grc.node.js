"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sai360Grc = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const datastore_1 = require("./resources/datastore");
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
            },
        };
    }
    async execute() {
        return await router_1.router.call(this);
    }
}
exports.Sai360Grc = Sai360Grc;
//# sourceMappingURL=Sai360Grc.node.js.map