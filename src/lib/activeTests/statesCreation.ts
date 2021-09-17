import {AdapterInstance} from '@iobroker/adapter-core';
import {TestUtils} from '../testClass';

export class Test extends TestUtils {

	public constructor(adapter: AdapterInstance) {
		super(adapter);
	}

	/**
     * Everything to setup the test but does not need to be measured
     */
	public async prepare(): Promise<void> {
		// set objects
		for (let i = 0; i < this.adapter.config.iterations; i++) {
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
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		// set states
		for (let i = 0; i < this.adapter.config.iterations; i++) {
			await this.adapter.setStateAsync(`test.${i}`, i, true);
		}
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// delete states
		for (let i = 0; i < this.adapter.config.iterations; i++) {
			await this.adapter.delStateAsync(`test.${i}`);
		}


		// delete objects
		for (let i = 0; i < this.adapter.config.iterations; i++) {
			await this.adapter.delObjectAsync(`test.${i}`);
		}
	}
}
