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
	public async addInstances(nInstances: number): Promise<void> {
		for (let i = 1; i <= nInstances; i++) {
			await execAsync(`iobroker add benchmark ${i} --enabled false`)
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
			await execAsync(`iobroker del benchmark.${i}`)
		}
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
	abstract cleanUp():Promise<void>;

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
