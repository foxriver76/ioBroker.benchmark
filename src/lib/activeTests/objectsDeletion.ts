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
        // create our objects locally
        await this.addObjects(this.adapter.config.iterations, 0);
    }

    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    public async prepareBetweenEpoch(): Promise<void> {
        // objects have been deleted
        await this.prepare();
    }

    /**
     * The test itself
     */
    public async execute(): Promise<void> {
        // del objects
        await this.delObjects(this.adapter.config.iterations, 0);
    }

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    public async cleanUpBetweenEpoch(): Promise<void> {
        // nothing
    }

    /**
     * Clean up the db, remove insatnces, etc.
     */
    public async cleanUp(): Promise<void> {
        // already deleted ;-)
    }
}
