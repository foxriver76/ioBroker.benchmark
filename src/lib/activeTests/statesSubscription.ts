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

		// TODO: send message to each instance to create the objects for the states
		for (let i=1; i <= 4; i++) {
			await this.adapter.sendToAsync(`benchmark.${i}`, 'objects', {cmd: 'set', n: this.adapter.config.iterations});
		}
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		this.adapter.subscribeForeignStates('benchmark.*');
		for (let i=1; i <= 4; i++) {
			await this.adapter.sendToAsync(`benchmark.${i}`, 'states', {cmd: 'set', n: this.adapter.config.iterations});
		}
		// TODO: subsribe and send messages to all instances
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
