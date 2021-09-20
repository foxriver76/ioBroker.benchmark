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
		// nada
	}

	/**
     * The test itself
     */
	public async execute(): Promise<void> {
		// chilling a bit idle here to collect some measurements
		await this.wait(this.adapter.config.iterations);
	}

	/**
     * Clean up the db, remove insatnces, etc.
     */
	public async cleanUp(): Promise<void> {
		// still nothing
	}
}
