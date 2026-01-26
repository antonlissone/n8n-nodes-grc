"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = router;
const n8n_workflow_1 = require("n8n-workflow");
const tableRecords = __importStar(require("./resources/tableRecords"));
const datastore = __importStar(require("./resources/datastore"));
const workflow = __importStar(require("./resources/workflow"));
const session = __importStar(require("./resources/session"));
const graphql = __importStar(require("./resources/graphql"));
async function router() {
    var _a;
    const items = this.getInputData();
    const returnData = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);
    const sai360 = { resource, operation };
    for (let i = 0; i < items.length; i++) {
        try {
            let responseData;
            switch (sai360.resource) {
                case 'tableRecords':
                    responseData = await tableRecords[sai360.operation].execute.call(this, i);
                    break;
                case 'datastore':
                    responseData = await datastore[sai360.operation].execute.call(this, i);
                    break;
                case 'session':
                    responseData = await session[sai360.operation].execute.call(this, i);
                    break;
                case 'workflow':
                    responseData = await workflow[sai360.operation].execute.call(this, i);
                    break;
                case 'graphql':
                    responseData = await graphql[sai360.operation].execute.call(this, i);
                    break;
                default:
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The resource "${resource}" is not known`);
            }
            returnData.push(...responseData.flat());
        }
        catch (error) {
            if (this.continueOnFail()) {
                const message = error instanceof Error ? error.message : String(error);
                const executionErrorData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({ error: message }), { itemData: { item: i } });
                returnData.push(...executionErrorData);
                continue;
            }
            if (error instanceof n8n_workflow_1.NodeApiError && ((_a = error === null || error === void 0 ? void 0 : error.context) === null || _a === void 0 ? void 0 : _a.itemIndex) === undefined) {
                if (error.context === undefined) {
                    error.context = {};
                }
                error.context.itemIndex = i;
            }
            throw error;
        }
    }
    return [returnData];
}
//# sourceMappingURL=router.js.map