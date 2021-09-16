import {AdapterInstance} from '@iobroker/adapter-core';

export class Test {
	private adapter: AdapterInstance;

	public constructor(adapter: AdapterInstance) {
		this.adapter = adapter;
	}

	/**
     * Everything to setup the test but does not need to be measured
     */
	public async prepare() {
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
	public async execute() {
		// set states
		for (let i = 0; i < this.adapter.config.iterations; i++) {
			await this.adapter.setStateAsync(`test.${i}`, i, true);
		}
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp() {
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
