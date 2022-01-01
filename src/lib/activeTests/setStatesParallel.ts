import {AdapterInstance} from '@iobroker/adapter-core';
import {TestUtils} from '../testClass';

export class Test extends TestUtils {

	public constructor(adapter: AdapterInstance) {
		super(adapter, {freeMemory: 2000});
	}

	/**
     * Everything to setup the test but does not need to be measured
     */
	public async prepare(): Promise<void> {
		// create instances
		this.adapter.log.info('Adding 30 instances');
		await this.addInstances(30);

		for (let i = 1; i <= 30; i++) {
			// give every adapter state objects
			await this.addObjects(this.adapter.config.iterations, i);
		}
	}

	/**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
	public async prepareBetweenEpoch(): Promise<void> {
		// nothing needed instances are still there with objects
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		const promises = [];
		for (let i = 1; i <= 30; i++) {
			// every instance should set the states in parallel
			await this.startMeasuringForeignInstance(i);
			promises.push(this.addStates(this.adapter.config.iterations, i));
		}

		await Promise.all(promises);

		for (let i = 1; i <= 30; i++) {
			// stop measuring if done
			await this.stopMeasuringForeignInstance(i);
		}
	}

	/**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
	public async cleanUpBetweenEpoch(): Promise<void> {
		// del only states on all instances
		for (let i = 1; i <= 30; i++) {
			await this.delStates(this.adapter.config.iterations, i);
		}
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// delete instances
		this.adapter.log.info('Deleting 30 instances');
		await this.removeInstances(30);
	}
}
