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
        // set objects
        await this.addObjects(this.adapter.config.iterations, 0);
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
        // set states
        await this.addStates(this.adapter.config.iterations, 0);
    }

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    public async cleanUpBetweenEpoch(): Promise<void> {
        // del only states
        await this.delStates(this.adapter.config.iterations, 0);
    }

    /**
     * Clean up the db, remove insatnces, etc.
     */
    public async cleanUp(): Promise<void> {
        // delete objects and states
        await this.delObjects(this.adapter.config.iterations, 0);
    }
}
