import {exec as execAsync} from 'promisify-child-process';
import {AdapterInstance} from '@iobroker/adapter-core';

export class TestUtils {
	public adapter: AdapterInstance;

	public constructor(adapter: AdapterInstance) {
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

			await this.adapter.setForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
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
}
