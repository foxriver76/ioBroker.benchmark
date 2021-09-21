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
const fs_1 = require("fs");
require("source-map-support/register");
class Benchmark extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'benchmark'
        });
        this.on('ready', this.onReady.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.activeTest = 'none';
        this.monitoringActive = false;
        this.memStats = {};
        this.cpuStats = {};
        this.controllerMemStats = {};
        this.controllerCpuStats = {};
        this.internalEventLoopLags = {};
        this.requestedMonitoring = {};
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        if (!this.config.secondaryMode) {
            // only main mode needs controller pid
            try {
                const pidsFileContent = (0, fs_1.readFileSync)(require.resolve('iobroker.js-controller/pids.txt')).toString();
                this.controllerPid = JSON.parse(pidsFileContent).pop();
                this.log.info(`Adapter started... controller determined (pid: ${this.controllerPid})`);
            }
            catch (e) {
                this.log.error(`Cannot determine controller pid file: ${e.message}`);
            }
        }
        else {
            this.log.info('Adapter started in secondary mode');
        }
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
                    await this.extendForeignObjectAsync(instance.id, { common: { enabled: false } });
                    this.restartInstances.push(instance.id);
                }
            }
        }
        this.config.iterations = this.config.iterations || 10000;
        this.config.epochs = this.config.epochs || 5;
        this.memStats = {};
        this.cpuStats = {};
        this.controllerCpuStats = {};
        this.controllerMemStats = {};
        this.internalEventLoopLags = {};
        this.requestedMonitoring = {};
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
            this.controllerMemStats[activeTestName] = [];
            this.controllerCpuStats[activeTestName] = [];
            this.internalEventLoopLags[activeTestName] = [];
            await this.setObjectNotExistsAsync(activeTestName, {
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
            this.log.info(`Starting test "${activeTestName}"`);
            // execute each test epochs time
            for (let j = 1; j <= this.config.epochs; j++) {
                const activeTestConstructor = allTests_1.tests[activeTestName];
                const activeTest = new activeTestConstructor(this);
                // prepare the test
                this.log.info('Prepare ...');
                await activeTest.prepare();
                // only measure real execution
                this.activeTest = activeTestName;
                const timeStart = process.hrtime();
                this.log.info('Execute ...');
                await activeTest.execute();
                const timeEnd = parseFloat(process.hrtime(timeStart).join('.'));
                this.activeTest = 'none';
                times[activeTestName].push(timeEnd);
                this.log.info('Clean ...');
                await activeTest.cleanUp();
                this.log.info(`Epoch ${j} finished in ${timeEnd} s - starting 30 s cooldown`);
                // wait 30 sec to "cooldown" system
                await this.wait(30000);
            }
            // set states - TIME
            const timeMean = this.round(this.calcMean(times[activeTestName]));
            const timeStd = this.round(this.calcStd(times[activeTestName]));
            await this.setStateAsync(`${activeTestName}.timeMean`, timeMean, true);
            await this.setStateAsync(`${activeTestName}.timeStd`, timeStd, true);
            // set states - CPU
            const cpuMean = this.round(this.calcMean(this.cpuStats[activeTestName]));
            const cpuStd = this.round(this.calcStd(this.cpuStats[activeTestName]));
            await this.setStateAsync(`${activeTestName}.cpuMean`, cpuMean, true);
            await this.setStateAsync(`${activeTestName}.cpuStd`, cpuStd, true);
            // set states - MEM
            const memMean = this.round(this.calcMean(this.memStats[activeTestName]) / 1000000);
            const memStd = this.round(this.calcStd(this.memStats[activeTestName]) / 1000000);
            await this.setStateAsync(`${activeTestName}.memMean`, memMean, true);
            await this.setStateAsync(`${activeTestName}.memStd`, memStd, true);
            // set states - event loop lag
            const eventLoopLagMean = this.round(this.calcMean(this.internalEventLoopLags[activeTestName]));
            const eventLoopLagStd = this.round(this.calcStd(this.internalEventLoopLags[activeTestName]));
            await this.setStateAsync(`${activeTestName}.eventLoopLagMean`, eventLoopLagMean, true);
            await this.setStateAsync(`${activeTestName}.eventLoopLagStd`, eventLoopLagStd, true);
            const actionsPerSecondMean = this.round(this.config.iterations / timeMean);
            const actionsPerSecondStd = timeStd !== 0 ? this.round(this.config.iterations / timeStd) : 0;
            await this.setStateAsync(`${activeTestName}.actionsPerSecondMean`, actionsPerSecondMean, true);
            await this.setStateAsync(`${activeTestName}.actionsPerSecondStd`, actionsPerSecondStd, true);
            // controller mem stats
            const controllerMemMean = this.round(this.calcMean(this.controllerMemStats[activeTestName]) / 1000000);
            const controllerMemStd = this.round(this.calcStd(this.controllerMemStats[activeTestName]) / 1000000);
            // controller cpu stats
            const controllerCpuMean = this.round(this.calcMean(this.controllerCpuStats[activeTestName]));
            const controllerCpuStd = this.round(this.calcStd(this.controllerCpuStats[activeTestName]));
            const summaryState = {
                timeMean,
                timeStd,
                cpuMean,
                cpuStd,
                memMean,
                memStd,
                controllerCpuMean,
                controllerCpuStd,
                controllerMemMean,
                controllerMemStd,
                eventLoopLagMean,
                eventLoopLagStd,
                actionsPerSecondMean,
                actionsPerSecondStd,
                epochs: this.config.epochs,
                iterations: this.config.iterations
            };
            // check all requested monitoring
            for (const [instance, result] of Object.entries(this.requestedMonitoring)) {
                summaryState.secondaries = summaryState.secondaries || {};
                const timeMean = this.round(this.calcMean(result.time));
                const timeStd = this.round(this.calcStd(result.time));
                summaryState.secondaries[instance] = {
                    cpuMean: this.round(this.calcMean(result.cpuStats)),
                    cpuStd: this.round(this.calcStd(result.cpuStats)),
                    memMean: this.round(this.calcMean(result.memStats) / 1000000),
                    memStd: this.round(this.calcStd(result.memStats) / 1000000),
                    eventLoopLagMean: this.round(this.calcMean(result.eventLoopLags)),
                    eventLoopLagStd: this.round(this.calcStd(result.eventLoopLags)),
                    timeMean,
                    timeStd,
                    actionsPerSecondMean: this.round(this.config.iterations / timeMean / Object.keys(this.requestedMonitoring).length),
                    actionsPerSecondStd: timeStd !== 0 ? this.round(this.config.iterations / timeStd / Object.keys(this.requestedMonitoring).length) : 0,
                    epochs: this.config.epochs,
                    iterations: this.config.iterations
                };
            }
            // update overall summary
            await this.setStateAsync(`${activeTestName}.summary`, JSON.stringify(summaryState), true);
            let overallSummary;
            try {
                // get the overall summary
                const state = await this.getStateAsync('summary');
                if (state && typeof state.val === 'string') {
                    overallSummary = JSON.parse(state.val);
                }
            }
            catch (_c) {
                // ignore
            }
            overallSummary = overallSummary || {};
            overallSummary[activeTestName] = summaryState;
            await this.setStateAsync('summary', JSON.stringify(overallSummary), true);
            // clear RAM
            delete this.cpuStats[activeTestName];
            delete this.memStats[activeTestName];
            delete this.controllerCpuStats[activeTestName];
            delete this.controllerMemStats[activeTestName];
            delete this.internalEventLoopLags[activeTestName];
            this.requestedMonitoring = {};
        }
        // we can stop the monitoring procedure
        this.monitoringActive = false;
        if (this.config.isolatedRun && this.restartInstances) {
            this.log.info('Restarting instances ...');
            for (const id of this.restartInstances) {
                await this.extendForeignObjectAsync(id, { common: { enabled: true } });
            }
        }
        this.log.info('Finished benchmark...');
        const summaryState = await this.getStateAsync('summary');
        if (summaryState) {
            this.log.info('Writing summary file ...');
            let summaryArr;
            try {
                const file = await this.readFileAsync('benchmark.files', 'history.json');
                const fileContent = typeof file.file === 'string' ? file.file : file.file.toString();
                summaryArr = JSON.parse(fileContent);
            }
            catch (_d) {
                summaryArr = [];
            }
            summaryArr.push(summaryState.val);
            await this.writeFileAsync('benchmark.files', 'history.json', JSON.stringify(summaryArr));
            this.log.info('Summary file written');
        }
    }
    /**
     * As secondary we want to listen to messages for tests
     */
    async onMessage(obj) {
        // only secondary mode instances need to response to messages
        if (!this.config.secondaryMode) {
            if (obj.command === 'test') {
                // run all tests on test command - do not await, we want to respond to message
                this.runTests(allTests_1.tests);
            }
            else if (allTests_1.tests[obj.command]) {
                const selectedTests = {};
                selectedTests[obj.command] = allTests_1.tests[obj.command];
                this.runTests(selectedTests);
            }
            else if (obj.command === 'requestedMonitoring') {
                // we have received a requested monitoring
                if (!this.requestedMonitoring[obj.from]) {
                    this.requestedMonitoring[obj.from] = { cpuStats: [], memStats: [], eventLoopLags: [], time: [] };
                }
                const monitoring = this.requestedMonitoring[obj.from];
                if (typeof obj.message === 'object') {
                    if (Array.isArray(obj.message.cpuStats)) {
                        monitoring.cpuStats = [...monitoring.cpuStats, ...obj.message.cpuStats];
                    }
                    if (Array.isArray(obj.message.memStats)) {
                        monitoring.memStats = [...monitoring.memStats, ...obj.message.memStats];
                    }
                    if (Array.isArray(obj.message.eventLoopLags)) {
                        monitoring.eventLoopLags = [...monitoring.eventLoopLags, ...obj.message.eventLoopLags];
                    }
                    if (Array.isArray(obj.message.time)) {
                        monitoring.time = [...monitoring.time, ...obj.message.time];
                    }
                }
            }
            else if (obj.command === 'cleanUp') {
                this.log.info('Cleaning up objects');
                await this.delObjectAsync('test', { recursive: true });
                this.log.info('Objects cleaned up');
            }
            else {
                this.log.warn(`Unknown message: ${JSON.stringify(obj)}`);
            }
        }
        else {
            // we run in secondary mode
            switch (obj.command) {
                case 'objects':
                    if (typeof obj.message === 'object') {
                        if (obj.message.cmd === 'set' && typeof obj.message.n === 'number') {
                            for (let i = 0; i < obj.message.n; i++) {
                                await this.setObjectAsync(`test.${obj.message.prefix}${i}`, {
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
                        else if (obj.message.cmd === 'del' && typeof obj.message.n === 'number') {
                            for (let i = 0; i < obj.message.n; i++) {
                                await this.delObjectAsync(`test.${obj.message.prefix}${i}`);
                            }
                        }
                    }
                    break;
                case 'states':
                    if (typeof obj.message === 'object') {
                        if (obj.message.cmd === 'set' && typeof obj.message.n === 'number') {
                            // set states
                            for (let i = 0; i < obj.message.n; i++) {
                                await this.setStateAsync(`test.${obj.message.prefix}${i}`, i, true);
                            }
                        }
                        else if (obj.message.cmd === 'del' && typeof obj.message.n === 'number') {
                            for (let i = 0; i < obj.message.n; i++) {
                                await this.delStateAsync(`test.${obj.message.prefix}${i}`);
                            }
                        }
                    }
                    break;
                case 'startMeasuring':
                    this.activeTest = 'requestedMonitoring';
                    this.monitoringActive = true;
                    this.cpuStats.requestedMonitoring = [];
                    this.memStats.requestedMonitoring = [];
                    this.internalEventLoopLags.requestedMonitoring = [];
                    this.requestedMonitoringStartTime = process.hrtime();
                    this.monitorStats();
                    this.measureEventLoopLag(50, lag => {
                        if (this.activeTest !== 'none') {
                            this.internalEventLoopLags[this.activeTest].push(lag);
                        }
                    });
                    break;
                case 'stopMeasuring':
                    this.activeTest = 'none';
                    this.monitoringActive = false;
                    // send report to controlling instance
                    if (this.requestedMonitoringStartTime) {
                        // we shouldn't receive a stop measuring if none has been started
                        const obj = {
                            eventLoopLags: this.internalEventLoopLags.requestedMonitoring,
                            memStats: this.memStats.requestedMonitoring,
                            cpuStats: this.cpuStats.requestedMonitoring,
                            time: [parseFloat(process.hrtime(this.requestedMonitoringStartTime).join('.'))]
                        };
                        await this.sendToAsync('benchmark.0', 'requestedMonitoring', obj);
                    }
                    // free ram
                    delete this.internalEventLoopLags.requestedMonitoring;
                    delete this.memStats.requestedMonitoring;
                    delete this.cpuStats.requestedMonitoring;
                    delete this.requestedMonitoringStartTime;
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
            if (this.controllerPid && !this.config.secondaryMode) {
                // only benchmark controller should monitor this
                const controllerStats = await (0, pidusage_1.default)(this.controllerPid);
                if (this.activeTest !== 'none') {
                    this.controllerCpuStats[this.activeTest].push(controllerStats.cpu);
                    this.controllerMemStats[this.activeTest].push(controllerStats.memory);
                }
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
     * @param ms The number of milliseconds for monitoring
     * @param cb Callback function to call for each new value
     */
    measureEventLoopLag(ms, cb) {
        let start = hrtime();
        let timeout;
        const check = () => {
            // how much time has actually elapsed in the loop beyond what
            // setTimeout says is supposed to happen. we use setTimeout to
            // cover multiple iterations of the event loop, getting a larger
            // sample of what the process is working on.
            const t = hrtime();
            // we use Math.max to handle case where timers are running efficiently
            // and our callback executes earlier than `ms` due to how timers are
            // implemented. this is ok. it means we're healthy.
            cb(Math.max(0, t - start - ms));
            start = t;
            // stop the process if no test active
            if (this.monitoringActive) {
                timeout = setTimeout(check, ms);
                timeout.unref();
            }
        };
        timeout = setTimeout(check, ms);
        timeout.unref();
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