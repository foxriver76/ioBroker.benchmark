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
		// create instances
		this.adapter.log.info('Adding 4 instances');
		await this.addInstances(4);

		for (let i = 1; i <= 4; i++) {
			await this.addObjects(this.adapter.config.iterations, i);
		}
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		this.adapter.subscribeForeignStates('benchmark.*');

		let counter = 0;
		return new Promise(resolve => {
			this.adapter.on('stateChange', () => {
				counter++;
				this.adapter.log.warn(counter.toString());
				if (counter === 40000) {
					resolve();
				}
			});

			for (let i = 1; i <= 4; i++) {
				// let it run in parallel
				this.addStates(this.adapter.config.iterations, i);
			}
		});
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// delete instances
		this.adapter.log.info('Deleting 4 instances');
		await this.removeInstances(4);
	}
}
