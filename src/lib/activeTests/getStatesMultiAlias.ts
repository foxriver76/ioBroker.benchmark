import { AdapterInstance } from '@iobroker/adapter-core';
import { TestUtils } from '../testClass';

export class Test extends TestUtils {
    public constructor(adapter: AdapterInstance) {
        super(adapter);
    }

    /**
     * Everything to setup the test but does not need to be measured
     */
    public async prepare(): Promise<void> {
        // set objects and states
        await this.addAliasObjects(10_000, 0);
        await this.addStates(10_000, 0);
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
        // get states
        const ids = [];

        for (let i = 0; i < 10_000; i++) {
            ids.push(`alias.0.__benchmark.${i}`);
        }

        for (let i = 0; i < this.adapter.config.iterations; i++) {
            // @ts-expect-error types are wrong
            await this.adapter.getForeignStatesAsync(ids);
        }
    }

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    public async cleanUpBetweenEpoch(): Promise<void> {
        // states still there
    }

    /**
     * Clean up the db, remove insatnces, etc.
     */
    public async cleanUp(): Promise<void> {
        // delete objects and states
        await this.delAliasObjects(10_000, 0);
    }
}
