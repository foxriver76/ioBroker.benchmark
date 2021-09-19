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
            name: 'benchmark'
        });
        this.on('ready', this.onReady.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.activeTest = 'none';
        this.monitoringActive = false;
        this.memStats = {};
        this.cpuStats = {};
        this.internalEventLoopLags = {};
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // everything message based right now
    }
    /**
     * Execute the tests for a non secondary adapter
     * @private
     */
    async runTests(selectedTests) {
        var _a, _b;
        // stop all instances if isolated run
        if (this.config.isolatedRun) {
            this.restartInstances = [];
            this.log.info('Isolated run, stopping all instances');
            const instancesObj = await this.getObjectViewAsync('system', 'instance', { startkey: '', endkey: '\u9999' });
            for (const instance of instancesObj.rows) {
                if (instance.id !== `system.adapter.${this.namespace}` && ((_b = (_a = instance.value) === null || _a === void 0 ? void 0 : _a.common) === null || _b === void 0 ? void 0 : _b.enabled)) {
                    // stop instances except own
                    instance.value.common.enabled = false;
                    await this.setForeignObjectAsync(instance.id, instance.value);
                    this.restartInstances.push(instance.id);
                }
            }
        }
        this.config.iterations = this.config.iterations || 10000;
        this.config.epochs = this.config.epochs || 5;
        this.memStats = {};
        this.cpuStats = {};
        this.internalEventLoopLags = {};
        const times = {};
        // monitor stats up from the beginning
        this.monitoringActive = true;
        this.monitorStats();
        this.measureEventLoopLag(50, lag => {
            if (this.activeTest !== 'none') {
                this.internalEventLoopLags[this.activeTest].push(lag);
            }
        });
        this.log.info('Starting benchmark test...');
        for (const activeTestName of Object.keys(selectedTests)) {
            times[activeTestName] = [];
            this.cpuStats[activeTestName] = [];
            this.memStats[activeTestName] = [];
            this.internalEventLoopLags[activeTestName] = [];
            await this.setForeignObjectNotExistsAsync(activeTestName, {
                type: 'channel',
                common: {
                    name: `Test ${activeTestName}`
                },
                native: {}
            });
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
            await this.setStateAsync(`${activeTestName}.timeMean`, this.round(this.calcMean(times[activeTestName])), true);
            await this.setStateAsync(`${activeTestName}.timeStd`, this.round(this.calcStd(times[activeTestName])), true);
            // set states - CPU
            await this.setStateAsync(`${activeTestName}.cpuMean`, this.round(this.calcMean(this.cpuStats[activeTestName])), true);
            await this.setStateAsync(`${activeTestName}.cpuStd`, this.round(this.calcStd(this.cpuStats[activeTestName])), true);
            // set states - MEM
            await this.setStateAsync(`${activeTestName}.memMean`, this.round(this.calcMean(this.memStats[activeTestName])), true);
            await this.setStateAsync(`${activeTestName}.memStd`, this.round(this.calcStd(this.memStats[activeTestName])), true);
            // set states - event loop lag
            await this.setStateAsync(`${activeTestName}.eventLoopLagMean`, this.round(this.calcMean(this.internalEventLoopLags[activeTestName])), true);
            await this.setStateAsync(`${activeTestName}.eventLoopLagStd`, this.round(this.calcStd(this.internalEventLoopLags[activeTestName])), true);
            // clear RAM
            delete this.cpuStats[activeTestName];
            delete this.memStats[activeTestName];
            delete this.internalEventLoopLags[activeTestName];
        }
        // we can stop the monitoring procedure
        this.monitoringActive = false;
        if (this.config.isolatedRun && this.restartInstances) {
            this.log.info('Restarting instances ...');
            for (const id of this.restartInstances) {
                const obj = await this.getForeignObjectAsync(id);
                if (obj && obj.common) {
                    obj.common.enabled = true;
                    await this.setForeignObjectAsync(id, obj);
                }
            }
        }
        this.log.info('Finished benchmark...');
    }
    /**
     * As secondary we want to listen to messages for tests
     */
    async onMessage(obj) {
        // only secondary mode instances need to response to messages
        if (!this.config.secondaryMode) {
            if (obj.command === 'test') {
                // run all tests on test command
                await this.runTests(allTests_1.tests);
            }
            else if (allTests_1.tests[obj.command]) {
                const selectedTests = {};
                selectedTests[obj.command] = allTests_1.tests[obj.command];
                await this.runTests(selectedTests);
            }
            else {
                this.log.warn(`Unknown message: ${JSON.stringify(obj)}`);
            }
        }
        else {
            switch (obj.command) {
                case 'objects':
                    if (typeof obj.message === 'object' && obj.message.cmd === 'set' && typeof obj.message.n === 'number') {
                        for (let i = 0; i < obj.message.n; i++) {
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
                    }
                    break;
                case 'states':
                    if (typeof obj.message === 'object' && obj.message.cmd === 'set' && typeof obj.message.n === 'number') {
                        // set states
                        for (let i = 0; i < obj.message.n; i++) {
                            await this.setStateAsync(`test.${i}`, i, true);
                        }
                    }
                    break;
            }
        }
        // answer to resolve the senders promise
        this.sendTo(obj.from, obj.command, {}, obj.callback);
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
        while (this.monitoringActive) {
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
    /**
     * Measure the Node.js event loop lag and repeatedly call the provided callback function with the updated results
     * @param {number} ms The number of milliseconds for monitoring
     * @param {function} cb Callback function to call for each new value
     */
    measureEventLoopLag(ms, cb) {
        let start = hrtime();
        let timeout = setTimeout(check, ms);
        timeout.unref();
        function check() {
            // workaround for https://github.com/joyent/node/issues/8364
            clearTimeout(timeout);
            // how much time has actually elapsed in the loop beyond what
            // setTimeout says is supposed to happen. we use setTimeout to
            // cover multiple iterations of the event loop, getting a larger
            // sample of what the process is working on.
            const t = hrtime();
            // we use Math.max to handle case where timers are running efficiently
            // and our callback executes earlier than `ms` due to how timers are
            // implemented. this is ok. it means we're healthy.
            cb && cb(Math.max(0, t - start - ms));
            start = t;
            timeout = setTimeout(check, ms);
            timeout.unref();
        }
        function hrtime() {
            const t = process.hrtime();
            return (t[0] * 1e3) + (t[1] / 1e6);
        }
    }
    /**
     * Round at two decimal places
     * @private
     */
    round(number) {
        return (Math.round(number * 100) / 100);
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