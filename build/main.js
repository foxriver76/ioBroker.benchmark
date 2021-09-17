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
const helper_1 = require("./lib/helper");
const allTests_1 = require("./lib/allTests");
class Benchmark extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'benchmark',
        });
        this.on('ready', this.onReady.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.activeTest = 'none';
        this.memStats = {};
        this.cpuStats = {};
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        if (!this.config.secondaryMode) {
            this.runActiveTests();
        }
    }
    /**
     * Execute the tests for a non secondary adapter
     * @private
     */
    async runActiveTests() {
        this.config.iterations = this.config.iterations || 10000;
        this.config.epochs = this.config.epochs || 5;
        const times = {};
        // monitor stats up from the beginning
        this.monitorStats();
        this.log.info('Starting benchmark test...');
        for (const activeTestName of Object.keys(allTests_1.tests)) {
            times[activeTestName] = [];
            this.cpuStats[activeTestName] = [];
            this.memStats[activeTestName] = [];
            // create objects for this test
            for (const obj of helper_1.testObjects) {
                const origId = obj._id;
                obj._id = `${this.namespace}.${activeTestName}.${obj._id}`;
                await this.setForeignObjectNotExistsAsync(obj._id, obj);
                // reset id
                obj._id = origId;
            }
            // execute each test epochs time
            for (let j = 1; j <= this.config.epochs; j++) {
                const activeTestConstructor = allTests_1.tests[activeTestName];
                const activeTest = new activeTestConstructor(this);
                // prepare the test
                await activeTest.prepare();
                // only measure real execution
                this.activeTest = activeTestName;
                const timeStart = process.hrtime();
                await activeTest.execute();
                const timeEnd = parseFloat(process.hrtime(timeStart).join('.'));
                this.activeTest = 'none';
                times[activeTestName].push(timeEnd);
                await activeTest.cleanUp();
            }
            // set states - TIME
            await this.setStateAsync(activeTestName + '.timeMean', this.calcMean(times[activeTestName]), true);
            await this.setStateAsync(activeTestName + '.timeStd', this.calcStd(times[activeTestName]), true);
            // set states - CPU
            await this.setStateAsync(activeTestName + '.cpuMean', this.calcMean(this.cpuStats[activeTestName]), true);
            await this.setStateAsync(activeTestName + '.cpuStd', this.calcStd(this.cpuStats[activeTestName]), true);
            // set states - MEM
            await this.setStateAsync(activeTestName + '.memMean', this.calcMean(this.memStats[activeTestName]), true);
            await this.setStateAsync(activeTestName + '.memStd', this.calcStd(this.memStats[activeTestName]), true);
        }
        this.log.info('Finished benchmark... terminating');
        this.terminate();
    }
    /**
     * As secondary we want to listen to messages for tests
     */
    onMessage(obj) {
        this.log.info(JSON.stringify(obj));
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
            if (this.activeTest !== 'none') {
                this.cpuStats[this.activeTest].push(stats.cpu);
                this.memStats[this.activeTest].push(stats.memory);
            }
            await this.wait(100);
        }
    }
    /**
     *    Time to wait in ms
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