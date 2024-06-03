import { AdapterInstance } from '@iobroker/adapter-core';
import { TestUtils } from '../testClass';

export class Test extends TestUtils {
    /** Number of secondaries to use */
    private NO_SECONDARIES = 10;

    public constructor(adapter: AdapterInstance) {
        super(adapter);
    }

    /**
     * Everything to setup the test but does not need to be measured
     */
    public async prepare(): Promise<void> {
        // create instances
        this.adapter.log.info(`Adding ${this.NO_SECONDARIES} instances`);
        await this.addInstances(this.NO_SECONDARIES);
        await this.addObjects(this.adapter.config.iterations, 0);

        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.subscribeStates(this.adapter.config.iterations, i, 'benchmark.0.test.');
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
        /** Array of promises for the single instances subscriptions */
        const promises: Promise<void>[] = [];

        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.startMeasuringForeignInstance(i);
            promises.push(this.waitForStatePublish(this.adapter.config.iterations, i));
        }

        await this.addStates(this.adapter.config.iterations, 0);
        // wait until all instances have received all publishes
        await Promise.all(promises);

        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.stopMeasuringForeignInstance(i);
        }
    }

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    public async cleanUpBetweenEpoch(): Promise<void> {
        // not needed
    }

    /**
     * Clean up the db, remove instances, etc.
     */
    public async cleanUp(): Promise<void> {
        // delete instances
        this.adapter.log.info(`Deleting ${this.NO_SECONDARIES} instances`);
        await this.removeInstances(this.NO_SECONDARIES);
    }
}
