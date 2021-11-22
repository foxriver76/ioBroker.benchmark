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
		// we create 98 % irrelevant objects
		const noMetaObjs = Math.round(this.adapter.config.iterations * 0.98);
		await this.addObjects(this.adapter.config.iterations - noMetaObjs, 0);
		await this.addMetaObjects(noMetaObjs);
	}

	/**
	 * Prepare step between epochs, set up stuff which has been removed during the test
	 */
	public async prepareBetweenEpoch(): Promise<void> {
		// nothing needed
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		// get 10k object views hard, iterations will only change number of objects
		for (let i = 0; i < 10000; i++) {
			await this.adapter.getObjectViewAsync('system', 'state', {
				startkey: 'benchmark.0.test',
				endkey: 'benchmark.0.test\u9999'
			});
		}
	}

	/**
	 * Clean up everything which has been set during the test, but obtain state after prepare step
	 */
	public async cleanUpBetweenEpoch(): Promise<void> {
		// we are fine
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// delete objects
		const noMetaObjs = Math.round(this.adapter.config.iterations * 0.98);
		await this.delObjects(this.adapter.config.iterations - noMetaObjs, 0);
		await this.delMetaObjects(noMetaObjs);
	}
}
