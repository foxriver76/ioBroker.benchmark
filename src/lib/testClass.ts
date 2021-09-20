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
			const instObj = await this.adapter.getForeignObjectAsync(`system.adapter.benchmark.${i}`);

			if (!instObj) {
				throw new Error(`Invalid instance object for system.adapter.benchmark.${i}`);
			}

			instObj.common.enabled = true;
			instObj.native.secondaryMode = true;

			await this.adapter.setForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
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
     */
	public async addObjects(n: number, instanceNumber: number): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// set objects locally
			for (let i = 0; i < n; i++) {
				await this.adapter.setObjectAsync(`test.${i}`, {
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
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {cmd: 'set', n: n});
		}
	}

	/**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
     */
	public async addStates(n: number, instanceNumber: number): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			for (let i = 0; i < n; i++) {
				await this.adapter.setStateAsync(`test.${i}`, i, true);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {cmd: 'set', n: n});
		}
	}

	/**
	 * Delete staes at given instance
	 *
	 * @param n - number of states to be deleted
	 * @param instanceNumber - number of the benchmark instance to delete states from
	 */
	public async delStates(n: number, instanceNumber: number): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// local
			for (let i = 0; i < n; i++) {
				await this.adapter.delStateAsync(`test.${i}`);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {cmd: 'del', n: n});
		}
	}

	/**
	 * Delete objects at given instance
	 *
	 * @param n - number of objects to be deleted
	 * @param instanceNumber - number of the benchmark instance to delete objects from
	 */
	public async delObjects(n: number, instanceNumber: number): Promise<void> {
		if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
			// local
			for (let i = 0; i < n; i++) {
				await this.adapter.delObjectAsync(`test.${i}`);
			}
		} else {
			await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {cmd: 'del', n: n});
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
     * Prepare steps which are needed for tests to be executed
     */
	abstract prepare(): Promise<void>;

	/**
     * The tests itself
     */
	abstract execute(): Promise<void>;

	/**
     * Clean up everything which has been created
     */
	abstract cleanUp(): Promise<void>;

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
