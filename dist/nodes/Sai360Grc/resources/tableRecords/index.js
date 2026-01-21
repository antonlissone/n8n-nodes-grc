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
exports.tableRecordsDescription = exports.saveXml = exports.saveJson = exports.queryXml = exports.queryJson = void 0;
const queryJson = __importStar(require("./queryJson"));
exports.queryJson = queryJson;
const queryXml = __importStar(require("./queryXml"));
exports.queryXml = queryXml;
const saveJson = __importStar(require("./saveJson"));
exports.saveJson = saveJson;
const saveXml = __importStar(require("./saveXml"));
exports.saveXml = saveXml;
const showOnlyForTableRecords = {
    resource: ['tableRecords'],
};
exports.tableRecordsDescription = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: showOnlyForTableRecords,
        },
        options: [
            {
                name: 'Get Records (JSON)',
                value: 'queryJson',
                action: 'Get table records as JSON',
                description: 'Retrieve table records in JSON format',
            },
            {
                name: 'Get Records (XML)',
                value: 'queryXml',
                action: 'Get table records as XML',
                description: 'Retrieve table records in XML format',
            },
            {
                name: 'Save Table Records From JSON',
                value: 'saveJson',
                action: 'Save table records from JSON',
                description: 'Create or update table records using JSON format',
            },
            {
                name: 'Save Table Records From XML',
                value: 'saveXml',
                action: 'Save table records from XML',
                description: 'Create or update table records using XML format',
            },
        ],
        default: 'queryJson',
    },
    ...queryJson.tableRecordsQueryJsonDescription,
    ...queryXml.tableRecordsQueryXmlDescription,
    ...saveJson.tableRecordsSaveJsonDescription,
    ...saveXml.tableRecordsSaveXmlDescription,
];
//# sourceMappingURL=index.js.map