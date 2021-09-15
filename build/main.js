"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const pidusage_1 = __importDefault(require("pidusage"));
class Benchmark extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'benchmark',
        });
        this.on('ready', this.onReady.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.activeTest = 'none';
        this.memStateCreation = [];
        this.memObjectCreation = [];
        this.memStateDeletion = [];
        this.memObjectDeletion = [];
        this.cpuStateCreation = [];
        this.cpuObjectCreation = [];
        this.cpuStateDeletion = [];
        this.cpuObjectDeletion = [];
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.config.iterations = this.config.iterations || 10000;
        this.config.epochs = this.config.epochs || 5;
        const objectsDeletionTimes = [];
        const statesDeletionTimes = [];
        const objectsCreationTimes = [];
        const statesCreationTimes = [];
        this.monitorStats();
        this.log.info('Starting benchmark test...');
        try {
            for (let j = 1; j <= this.config.epochs; j++) {
                // set objects
                const objectsStartTime = process.hrtime();
                this.activeTest = 'objectCreation';
                for (let i = 0; i < this.config.iterations; i++) {
                    await this.setObjectAsync(`test.${i}`, {
                        'type': 'state',
                        'common': {
                            name: i.toString(),
                            read: true,
                            write: true,
                            role: 'state',
                            type: 'number'
                        },
                        native: {}
                    });
                }
                const objectsCreationTime = parseFloat(process.hrtime(objectsStartTime).join('.'));
                objectsCreationTimes.push(objectsCreationTime);
                this.log.info(`Epoch ${j}: Objects creation took ${objectsCreationTime} s`);
                // set states
                const statesStartTime = process.hrtime();
                this.activeTest = 'stateCreation';
                for (let i = 0; i < this.config.iterations; i++) {
                    await this.setStateAsync(`test.${i}`, i, true);
                }
                const statesCreationTime = parseFloat(process.hrtime(statesStartTime).join('.'));
                statesCreationTimes.push(statesCreationTime);
                this.log.info(`Epoch ${j}: States creation took ${statesCreationTime} s`);
                // delete states
                const statesDeletionStartTime = process.hrtime();
                this.activeTest = 'stateDeletion';
                for (let i = 0; i < this.config.iterations; i++) {
                    await this.delStateAsync(`test.${i}`);
                }
                const statesDeletionTime = parseFloat(process.hrtime(statesDeletionStartTime).join('.'));
                statesDeletionTimes.push(statesDeletionTime);
                this.log.info(`Epoch ${j}: States deletion took ${statesDeletionTime} s`);
                // delete objects
                const objectsDeletionStartTime = process.hrtime();
                this.activeTest = 'objectDeletion';
                for (let i = 0; i < this.config.iterations; i++) {
                    await this.delObjectAsync(`test.${i}`);
                }
                const objectsDeletionTime = parseFloat(process.hrtime(objectsDeletionStartTime).join('.'));
                objectsDeletionTimes.push(objectsDeletionTime);
                this.log.info(`Epoch ${j}: Objects deletion took ${objectsDeletionTime} s`);
            }
            // set mean states
            await this.setStateAsync('states.deletionTimeMean', this.calcMean(statesDeletionTimes), true);
            await this.setStateAsync('states.creationTimeMean', this.calcMean(statesCreationTimes), true);
            await this.setStateAsync('objects.deletionTimeMean', this.calcMean(objectsDeletionTimes), true);
            await this.setStateAsync('objects.creationTimeMean', this.calcMean(objectsCreationTimes), true);
            // set std states
            await this.setStateAsync('states.deletionTimeStd', this.calcStd(statesDeletionTimes), true);
            await this.setStateAsync('states.creationTimeStd', this.calcStd(statesCreationTimes), true);
            await this.setStateAsync('objects.deletionTimeStd', this.calcStd(objectsDeletionTimes), true);
            await this.setStateAsync('objects.creationTimeStd', this.calcStd(objectsCreationTimes), true);
            this.log.info('Finished benchmark... terminating');
            this.terminate();
        }
        catch (e) {
            this.log.error(`Benchmark failed: ${e.message}`);
            this.terminate();
        }
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            callback();
        }
        catch (_a) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
    /**
     *  Calculates the mean of an array
     */
    calcMean(arr) {
        const sum = arr.reduce((partialSum, x) => partialSum + x, 0);
        return sum / arr.length;
    }
    /**
     * Calculates the standard deviation of an array
     */
    calcStd(arr) {
        const mean = this.calcMean(arr);
        // get squared diff from mean
        const sqDiffs = arr.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const avgSqDiff = this.calcMean(sqDiffs);
        return Math.sqrt(avgSqDiff);
    }
    /**
     * Get memory and cpu statistics
     */
    async monitorStats() {
        while (true) {
            const stats = await (0, pidusage_1.default)(process.pid);
            this.log.warn(JSON.stringify(stats));
            switch (this.activeTest) {
                case 'stateDeletion':
                    break;
                case 'objectDeletion':
                    break;
                case 'stateCreation':
                    break;
                case 'objectCreation':
                    break;
                default:
                    break;
            }
            await this.wait(100);
        }
    }
    /**
     *	Time to wait in ms
     */
    async wait(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Benchmark(options);
}
else {
    // otherwise start the instance directly
    (() => new Benchmark())();
}
//# sourceMappingURL=main.js.map