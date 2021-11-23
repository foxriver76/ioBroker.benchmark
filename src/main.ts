import * as utils from '@iobroker/adapter-core';
import pidusage from 'pidusage';
import {testObjects} from './lib/helper';
import {tests as allTests} from './lib/allTests';
import {readFileSync} from 'fs';
import 'source-map-support/register';

type Timeout = NodeJS.Timeout;

interface RequestedMonitoringEntry {
	time: number[];
	cpuStats: number[];
	memStats: number[];
	eventLoopLags: number[];
}

interface SummaryState {
	secondaries?: Record<string, SummaryState>;
	controllerMemMean?: number;
	controllerMemStd?: number;
	controllerCpuMean?: number;
	controllerCpuStd?: number;
	timeMean: number;
	timeStd: number;
	memMean: number;
	memStd: number;
	cpuMean: number;
	cpuStd: number;
	eventLoopLagMean: number;
	eventLoopLagStd: number;
	actionsPerSecondMean: number;
	actionsPerSecondStd: number;
	epochs: number;
	iterations: number;
	objectsDbType?: string,
	statesDbType?: string
}

class Benchmark extends utils.Adapter {
	private activeTest: string;
	private memStats: Record<string, number[]>;
	private controllerMemStats: Record<string, number[]>
	private controllerCpuStats: Record<string, number[]>
	private cpuStats: Record<string, number[]>;
	private restartInstances: string[] | undefined;
	private monitoringActive: boolean;
	private internalEventLoopLags: Record<string, number[]>;
	private requestedMonitoring: Record<string, RequestedMonitoringEntry>;
	private requestedMonitoringStartTime: [number, number] | undefined;
	private controllerPid: number | undefined;
	private objectsDbType: string | undefined;
	private statesDbType: string | undefined;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
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
	private async onReady(): Promise<void> {
		if (!this.config.secondaryMode) {
			// only main mode needs controller pid
			try {
				const pidsFileContent = readFileSync(require.resolve('iobroker.js-controller/pids.txt')).toString();
				this.controllerPid = JSON.parse(pidsFileContent).pop();
				this.log.info(`Adapter started... controller determined (pid: ${this.controllerPid})`);
			} catch (e: any) {
				this.log.error(`Cannot determine controller pid file: ${e.message}`);
			}
		} else {
			this.log.info('Adapter started in secondary mode');
		}

		const baseSettigns = (await this.sendToHostAsync(this.host, 'readBaseSettings', {})) as Record<string, any>;

		if (baseSettigns?.config?.objects && baseSettigns?.config?.states) {
			this.objectsDbType = baseSettigns.config.objects.type;
			this.statesDbType = baseSettigns.config.states.type;
		} else {
			this.log.error('Cannot determine DB type');
			this.terminate();
		}
	}

	/**
     * Execute the tests for a non secondary adapter
     * @private
     */
	private async runTests(selectedTests: string[]): Promise<void> {
		// stop all instances if isolated run
		if (this.config.isolatedRun) {
			this.restartInstances = [];
			this.log.info('Isolated run, stopping all instances');
			const instancesObj = await this.getObjectViewAsync('system', 'instance', {startkey: '', endkey: '\u9999'});
			for (const instance of instancesObj.rows) {
				if (instance.id !== `system.adapter.${this.namespace}` && instance.value?.common?.enabled) {
					// stop instances except own
					await this.extendForeignObjectAsync(instance.id, {common: {enabled: false}});
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

		const times: Record<string, number[]> = {};

		// monitor stats up from the beginning
		this.monitoringActive = true;
		this.monitorStats();
		this.measureEventLoopLag(50, lag => {
			if (this.activeTest !== 'none') {
				this.internalEventLoopLags[this.activeTest].push(lag);
			}
		});

		this.log.info('Starting benchmark test...');

		for (const activeTestName of selectedTests) {
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
			for (const obj of testObjects) {
				const origId = obj._id;
				obj._id = `${this.namespace}.${activeTestName}.${obj._id}`;
				await this.setForeignObjectNotExistsAsync(obj._id, obj);
				// reset id
				obj._id = origId;
			}

			this.log.info(`Starting test "${activeTestName}"`);
			// execute each test epochs time
			for (let j = 1; j <= this.config.epochs; j++) {

				const activeTestConstructor = allTests[activeTestName];
				const activeTest = new activeTestConstructor(this);

				// prepare the test
				if (j === 1) {
					this.log.info('Prepare ...');
					await activeTest.prepare();
				} else {
					this.log.info('Prepare between epoch ...');
					await activeTest.prepareBetweenEpoch();
				}

				// only measure real execution
				this.activeTest = activeTestName;

				const timeStart = process.hrtime();

				this.log.info('Execute ...');
				await activeTest.execute();

				const timeEnd = parseFloat(process.hrtime(timeStart).join('.'));

				this.activeTest = 'none';

				times[activeTestName].push(timeEnd);

				// receive clean state again
				if (j === this.config.epochs) {
					// last epoch clean up all
					this.log.info('Clean ...');
					await activeTest.cleanUp();
				} else {
					this.log.info('Clean between epoch ...');
					await activeTest.cleanUpBetweenEpoch();
				}

				if (selectedTests.indexOf(activeTestName) === selectedTests.length - 1 && j === this.config.epochs) {
					// it was the last test + last epoch, no need to cooldown
					this.log.info(`Epoch ${j} finished in ${timeEnd} s`);
				} else {
					// there are still tests to go, so cooldown
					// for cooldown we respect full time
					const timeWithClean = parseFloat(process.hrtime(timeStart).join('.'));

					// cooldown ~test + clean time but maximum 30 seconds and minimum 10 seconds
					const cooldownSec = Math.max(Math.min(Math.round(timeWithClean), 30), 10);
					this.log.info(`Epoch ${j} finished in ${timeEnd} s - starting ${cooldownSec} s cooldown`);
					// wait to "cooldown" system
					await this.wait(cooldownSec * 1000);
				}
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
			const actionsPerSecondStd = this.round(this.calcStd(times[activeTestName].map(time => this.config.iterations / time)));

			await this.setStateAsync(`${activeTestName}.actionsPerSecondMean`, actionsPerSecondMean, true);
			await this.setStateAsync(`${activeTestName}.actionsPerSecondStd`, actionsPerSecondStd , true);

			// controller mem stats
			const controllerMemMean = this.round(this.calcMean(this.controllerMemStats[activeTestName]) / 1000000);
			const controllerMemStd = this.round(this.calcStd(this.controllerMemStats[activeTestName]) / 1000000);

			// controller cpu stats
			const controllerCpuMean = this.round(this.calcMean(this.controllerCpuStats[activeTestName]));
			const controllerCpuStd = this.round(this.calcStd(this.controllerCpuStats[activeTestName]));

			const summaryState: SummaryState = {
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
				iterations: this.config.iterations,
				statesDbType: this.statesDbType,
				objectsDbType: this.objectsDbType
			};

			// check all requested monitoring
			for (const [instance, result] of Object.entries(this.requestedMonitoring)) {
				summaryState.secondaries = summaryState.secondaries || {};
				const timeMean = this.round(this.calcMean(result.time));
				const timeStd = this.round(this.calcStd(result.time));

				summaryState.secondaries[instance] = {
					cpuMean:this.round(this.calcMean(result.cpuStats)),
					cpuStd: this.round(this.calcStd(result.cpuStats)),
					memMean: this.round(this.calcMean(result.memStats) / 1000000),
					memStd: this.round(this.calcStd(result.memStats) / 1000000),
					eventLoopLagMean: this.round(this.calcMean(result.eventLoopLags)),
					eventLoopLagStd: this.round(this.calcStd(result.eventLoopLags)),
					timeMean,
					timeStd,
					actionsPerSecondMean: this.round(this.config.iterations / timeMean / Object.keys(this.requestedMonitoring).length), // actions are split on all instances
					actionsPerSecondStd: this.round(this.calcStd(result.time.map(time => this.config.iterations / time / Object.keys(this.requestedMonitoring).length))),
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
			} catch {
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
				await this.extendForeignObjectAsync(id, {common: {enabled: true}});
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
			} catch {
				summaryArr = [];
			}

			if (typeof summaryState.val === 'string') {
				summaryArr.push(JSON.parse(summaryState.val));
				await this.writeFileAsync('benchmark.files', 'history.json', JSON.stringify(summaryArr, null, 2));
				this.log.info('Summary file written');
			}
		}
	}

	/**
     * As secondary we want to listen to messages for tests
     */
	private async onMessage(obj: ioBroker.Message): Promise<void> {
		// only secondary mode instances need to response to messages
		if (!this.config.secondaryMode) {
			if (obj.command === 'test') {
				// run all tests on test command - do not await, we want to respond to message
				this.runTests(Object.keys(allTests));
			} else if (allTests[obj.command]) {
				this.runTests([obj.command]);
			} else if (obj.command === 'requestedMonitoring') {
				// we have received a requested monitoring
				if (!this.requestedMonitoring[obj.from]) {
					this.requestedMonitoring[obj.from] = {cpuStats: [], memStats: [], eventLoopLags: [], time: []};
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
			} else if (obj.command === 'cleanUp') {
				this.log.info('Cleaning up objects');
				await this.delForeignObjectAsync('alias.0.__benchmark', {recursive: true});
				await this.delObjectAsync('test', {recursive: true});
				this.log.info('Objects cleaned up');
			} else {
				this.log.warn(`Unknown message: ${JSON.stringify(obj)}`);
			}
		} else {
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
						} else if (obj.message.cmd === 'del' && typeof obj.message.n === 'number') {
							for (let i = 0; i < obj.message.n; i++) {
								await this.delObjectAsync(`test.${obj.message.prefix}${i}`);
							}
						} else if (obj.message.cmd === 'delAlias' && typeof obj.message.n === 'number') {
							for (let i = obj.message.startIdx; i < obj.message.n + obj.message.startIdx; i++) {
								// del alias first
								await this.delForeignObjectAsync(`alias.0.__benchmark.${obj.message.prefix}${i}`);
								await this.delObjectAsync(`test.${obj.message.prefix}${i}`);
							}
						} else if (obj.message.cmd === 'setAlias' && typeof obj.message.n === 'number') {
							// create object and then alias
							for (let i = obj.message.startIdx; i < obj.message.startIdx + obj.message.n; i++) {
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

								await this.setForeignObjectAsync(`alias.0.__benchmark.${obj.message.prefix}${i}`, {
									type: 'state',
									common: {
										name: 'I am an alias',
										read: true,
										write: true,
										role: 'state',
										type: 'number',
										alias: {
											id: `${this.namespace}.test.${obj.message.prefix}${i}`
										}
									},
									native: {}
								});
							}
						}
					}
					break;
				case 'states':
					if (typeof obj.message === 'object') {
						if (obj.message.cmd === 'set' && typeof obj.message.n === 'number') {
							// set states
							for (let i = obj.message.startIdx; i < obj.message.n + obj.message.startIdx; i++) {
								await this.setStateAsync(`test.${obj.message.prefix}${i}`, i, true);
							}
						} else if (obj.message.cmd === 'del' && typeof obj.message.n === 'number') {
							for (let i = obj.message.startIdx; i < obj.message.n + obj.message.startIdx; i++) {
								await this.delStateAsync(`test.${obj.message.prefix}${i}`);
							}
						} else if (obj.message.cmd === 'setAlias' && typeof obj.message.n === 'number') {
							for (let i = obj.message.startIdx; i < obj.message.n + obj.message.startIdx; i++) {
								await this.setForeignStateAsync(`alias.0.__benchmark.${obj.message.prefix}${i}`, i);
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
						const obj: RequestedMonitoringEntry = {
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
				case 'testMessage':
					// we received a message from a test, just ignore and send it back
					break;
				default:
					this.log.warn(`Unknown command message: ${obj.command}`);
			}
		}

		// answer to resolve the senders promise
		this.sendTo(obj.from, obj.command, {}, obj.callback);
	}

	/**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch {
			callback();
		}
	}

	/**
     *  Calculates the mean of an array
     */
	private calcMean(arr: number[]): number {
		const sum = arr.reduce((partialSum, x) => partialSum + x, 0);
		return sum / arr.length;
	}

	/**
     * Calculates the standard deviation of an array
     */
	private calcStd(arr: number[]): number {
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
	private async monitorStats(): Promise<void> {
		while (this.monitoringActive) {
			const stats = await pidusage(process.pid);

			if (this.activeTest !== 'none') {
				this.cpuStats[this.activeTest].push(stats.cpu);
				this.memStats[this.activeTest].push(stats.memory);
			}

			if (this.controllerPid && !this.config.secondaryMode) {
				// only benchmark controller should monitor this
				const controllerStats = await pidusage(this.controllerPid);

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
	private async wait(ms: number): Promise<void> {
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
	private measureEventLoopLag(ms:number, cb: (lag: number) => void): void {
		let start = hrtime();

		let timeout: Timeout;

		const check:() => void = () => {
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

		function hrtime():number {
			const t = process.hrtime();
			return (t[0] * 1e3) + (t[1] / 1e6);
		}
	}

	/**
	 * Round at two decimal places
	 * @private
	 */
	private round(number: number): number {
		return (Math.round(number * 100) / 100);
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Benchmark(options);
} else {
	// otherwise start the instance directly
	(() => new Benchmark())();
}
