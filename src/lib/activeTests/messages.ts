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
		// add instance to send message to
		await this.addInstances(1);
	}

	/**
	 * Prepare step between epochs, set up stuff which has been removed during the test
	 */
	public async prepareBetweenEpoch(): Promise<void> {
		// we are just sending meassages
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		// get states
		await this.sendMessages(this.adapter.config.iterations, 1);
	}

	/**
	 * Clean up everything which has been set during the test, but obtain state after prepare step
	 */
	public async cleanUpBetweenEpoch(): Promise<void> {
		// we have just sent meassages
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// delete the instance
		await this.removeInstances(1);
	}
}
