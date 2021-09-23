import {exec as execAsync} from 'promisify-child-process';
import {AdapterInstance} from '@iobroker/adapter-core';

export abstract class TestUtils {
	public adapter: AdapterInstance;

	protected constructor(adapter: AdapterInstance) {
		this.adapter = adapter;
	}

	/**
     * Adds the desired number of instances in secondaryMode
     */
	public async addInstances(nInstances: number, host?: string): Promise<void> {
		for (let i = 1; i <= nInstances; i++) {
			await execAsync(`iobroker add benchmark ${i} --enabled false${host ? ` --host ${host}` : ''}`);

			// enable instance in secondaryMode
			const instObj = {common: {enabled: true}, native: {secondaryMode: true}};

			await this.adapter.extendForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
			// give controller some time to actually start the instance
			await this.wait(500);
		}
	}

	/**
     * Removes the desired number of instances
     */
	public async removeInstances(nInstances: number): Promise<void> {
		for (let i = 1; i <= nInstances; i++) {
			await execAsync(`iobroker del benchmark.${i}`);
		}
	}

	/**
     * Add Objects at given instance
     *
     * @param n - number of objects to be added
     * @param instanceNumber - number of the benchmark instance to add objects at
	 * @param prefix - prefix for ids
     */
	public async addObjects(n: number, instanceNumber: number, prefix=''): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// set objects locally
			for (let i = 0; i < n; i++) {
				await this.adapter.setObjectAsync(`test.${prefix}${i}`, {
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
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {cmd: 'set', n, prefix});
		}
	}

	/**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
	 * @param prefix - prefix for ids
     */
	public async addStates(n: number, instanceNumber: number, prefix=''): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			for (let i = 0; i < n; i++) {
				await this.adapter.setStateAsync(`test.${prefix}${i}`, i, true);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {cmd: 'set', n, prefix});
		}
	}

	/**
	 * Delete staes at given instance
	 *
	 * @param n - number of states to be deleted
	 * @param instanceNumber - number of the benchmark instance to delete states from
	 * @param prefix - prefix for ids
	 */
	public async delStates(n: number, instanceNumber: number, prefix=''): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// local
			for (let i = 0; i < n; i++) {
				await this.adapter.delStateAsync(`test.${prefix}${i}`);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {cmd: 'del', n, prefix});
		}
	}

	/**
	 * Delete objects (and states) at given instance
	 *
	 * @param n - number of objects to be deleted
	 * @param instanceNumber - number of the benchmark instance to delete objects from
	 * @param prefix - prefix for ids
	 */
	public async delObjects(n: number, instanceNumber: number, prefix=''): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// local
			for (let i = 0; i < n; i++) {
				await this.adapter.delObjectAsync(`test.${prefix}${i}`);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {cmd: 'del', n, prefix});
		}
	}

	/**
	 *	Get n states, only supported on local (controller) instance
	 *
	 * @param n - number of states to get
	 * @param prefix - prefix for ids
	 */
	public async getStates(n :number, prefix='') {
		for (let i = 0; i < n; i++) {
			await this.adapter.getStateAsync(`test.${prefix}${i}`);
		}
	}

	/**
	 * Start measuring a foreign instance to (eventLoopLag, ram, cpu)
	 *
	 * @param instanceNumber - number of the benchmark instance to add states at
	 */
	public async startMeasuringForeignInstance(instanceNumber: number): Promise<void> {
		await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'startMeasuring', {});
	}

	/**
	 * Stop measuring a foreign instance to (eventLoopLag, ram, cpu)
	 *
	 * @param instanceNumber - number of the benchmark instance to add states at
	 */
	public async stopMeasuringForeignInstance(instanceNumber: number): Promise<void> {
		await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'stopMeasuring', {});
	}

	/**
     * Prepare steps which are needed for tests to be executed before first test starts
     */
	abstract prepare(): Promise<void>;

	/**
	 * Prepare step between epochs, set up stuff which has been removed during the test
	 */
	abstract prepareBetweenEpoch(): Promise<void>

	/**
     * The tests itself
     */
	abstract execute(): Promise<void>;

	/**
     * Clean up everything which has been created
     */
	abstract cleanUp(): Promise<void>;

	/**
	 * Clean up everything which has been set during the test, but obtain state after prepare step
	 */
	abstract cleanUpBetweenEpoch(): Promise<void>

	/**
     * Time to wait in ms
     */
	public async wait(ms: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, ms);
		});
	}
}
