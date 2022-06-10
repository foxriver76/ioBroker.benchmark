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
        // set objects and states (alias with read function)
        await this.addAliasObjects(this.adapter.config.iterations, 0, '', true);
        await this.addStates(this.adapter.config.iterations, 0);
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
        // get states from alias
        await this.getStatesFromAlias(this.adapter.config.iterations);
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
        await this.delAliasObjects(this.adapter.config.iterations, 0);
    }
}
