import * as utils from '@iobroker/adapter-core';
import pidusage from 'pidusage';
import {testObjects} from './lib/helper';
import {tests as allTests} from './lib/allTests';

class Benchmark extends utils.Adapter {
	private activeTest: string;
	private memStats: any;
	private cpuStats: any;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
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

		this.memStats = {};
		this.cpuStats = {};
	}

	/**
     * Is called when databases are connected and adapter received configuration.
     */
	private async onReady(): Promise<void> {
		this.config.iterations = this.config.iterations || 10000;
		this.config.epochs = this.config.epochs || 5;

		const times: Record<string, any> = {};

		// monitor stats up from the beginning
		this.monitorStats();
		this.log.info('Starting benchmark test...');

		for (const activeTestName of Object.keys(allTests)) {
			times[activeTestName] = [];
			this.cpuStats[activeTestName] = [];
			this.memStats[activeTestName] = [];

			// create objects for this test
			for (const obj of testObjects) {
				obj._id = `${this.namespace}.${activeTestName}.${obj._id}`;
				await this.setForeignObjectNotExistsAsync(obj._id, obj);
			}

			// execute each test epochs time
			for (let j = 1; j <= this.config.epochs; j++) {

				const activeTestConstructor = allTests[activeTestName];
				const activeTest = new activeTestConstructor(this);

				// prepare the test
				await activeTest.prepare()

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
     * Is called if a subscribed state changes
     */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
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
		while (true) {
			const stats = await pidusage(process.pid);

			if (this.activeTest !== 'none') {
				this.cpuStats[this.activeTest] = stats.cpu;
				this.memStats[this.activeTest] = stats.memory;
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
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Benchmark(options);
} else {
	// otherwise start the instance directly
	(() => new Benchmark())();
}
