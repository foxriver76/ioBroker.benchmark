"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testObjects = void 0;
exports.testObjects = [
    {
        _id: 'timeMean',
        type: 'state',
        common: {
            name: 'Time Mean',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 's'
        },
        native: {}
    },
    {
        _id: 'timeStd',
        type: 'state',
        common: {
            name: 'Time Standard Deviation',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 's'
        },
        native: {}
    },
    {
        _id: 'cpuMean',
        type: 'state',
        common: {
            name: 'CPU Mean',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: '%'
        },
        native: {}
    },
    {
        _id: 'cpuStd',
        type: 'state',
        common: {
            name: 'CPU Standard Deviation',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: '%'
        },
        native: {}
    },
    {
        _id: 'memMean',
        type: 'state',
        common: {
            name: 'MEM Mean',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 'MB'
        },
        native: {}
    },
    {
        _id: 'memStd',
        type: 'state',
        common: {
            name: 'MEM Standard Deviation',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 'MB'
        },
        native: {}
    },
    {
        _id: 'eventLoopLagMean',
        type: 'state',
        common: {
            name: 'Event Loop Lag Mean',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 'ms'
        },
        native: {}
    },
    {
        _id: 'eventLoopLagStd',
        type: 'state',
        common: {
            name: 'Event Loop Lag Standard Deviation',
            role: 'state',
            type: 'number',
            write: false,
            read: true,
            unit: 'ms'
        },
        native: {}
    },
    {
        _id: 'summary',
        type: 'state',
        common: {
            name: 'Summary',
            role: 'state',
            type: 'object',
            write: false,
            read: true
        },
        native: {}
    },
    {
        _id: 'actionsPerSecondMean',
        type: 'state',
        common: {
            name: 'Actions per Second Mean',
            role: 'state',
            type: 'number',
            write: false,
            read: true
        },
        native: {}
    },
    {
        _id: 'actionsPerSecondStd',
        type: 'state',
        common: {
            name: 'Actions per Second Standard Deviation',
            role: 'state',
            type: 'number',
            write: false,
            read: true
        },
        native: {}
    }
];
//# sourceMappingURL=helper.js.map