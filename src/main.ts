import * as utils from '@iobroker/adapter-core';

// Load your modules here, e.g.:
// import * as fs from "fs";

class Benchmark extends utils.Adapter {

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
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		this.config.iterations = this.config.iterations || 10000;

		this.log.info('Starting benchmark test...')
		try {
			// set objects
			const objectsStartTime = process.hrtime()
			for (let i = 0; i <= this.config.iterations; i++) {
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
			await this.setStateAsync('objects.creationTime', objectsCreationTime, true);
			this.log.info(`Objects creation took ${objectsCreationTime} s`);

			// set states
			const statesStartTime = process.hrtime()
			for (let i = 0; i <= this.config.iterations; i++) {
				await this.setStateAsync(`test.${i}`, i, true);
			}

			const statesCreationTime = parseFloat(process.hrtime(statesStartTime).join('.'));
			await this.setStateAsync('states.creationTime', statesCreationTime, true);
			this.log.info(`States creation took ${statesCreationTime} s`);

			// delete states
			const statesDeletionStartTime = process.hrtime();
			for (let i = 0; i <= this.config.iterations; i++) {
				await this.delStateAsync(`test.${i}`);
			}

			const statesDeletionTime = parseFloat(process.hrtime(statesDeletionStartTime).join('.'));
			await this.setStateAsync('states.deletionTime', statesDeletionTime, true);
			this.log.info(`States deletion took ${statesDeletionTime} s`);

			// delete objects
			const objectsDeletionStartTime = process.hrtime();
			for (let i = 0; i <= this.config.iterations; i++) {
				await this.delObjectAsync(`test.${i}`);
			}

			const objectsDeletionTime = parseFloat(process.hrtime(objectsDeletionStartTime).join('.'));
			await this.setStateAsync('objects.deletionTime', objectsDeletionTime, true);
			this.log.info(`Objects deletion took ${objectsDeletionTime} s`);

			this.log.info('Finished benchmark... terminating');
			this.terminate();
		} catch (e: any) {
			this.log.error(`Benchmark failed: ${e.message}`);
			this.terminate();
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch (e) {
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
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Benchmark(options);
} else {
	// otherwise start the instance directly
	(() => new Benchmark())();
}
