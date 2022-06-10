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
        // create instances
        this.adapter.log.info('Adding 4 instances');
        await this.addInstances(4);

        for (let i = 1; i <= 4; i++) {
            // we need at least adapter.config.iterations states to fullfil our subscription
            await this.addObjects(Math.ceil(this.adapter.config.iterations / 4), i);
        }

        // subscribe
        await this.adapter.subscribeForeignStatesAsync('benchmark.*');
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
        let counter = 0;
        return new Promise(async resolve => {
            const onStateChange: () => void = () => {
                counter++;
                if (counter === this.adapter.config.iterations) {
                    resolve();
                    this.adapter.removeListener('stateChange', onStateChange);
                }
            };

            this.adapter.on('stateChange', onStateChange);

            for (let i = 1; i <= 4; i++) {
                await this.startMeasuringForeignInstance(i);
                await this.addStates(Math.ceil(this.adapter.config.iterations / 4), i);
                await this.stopMeasuringForeignInstance(i);
            }
        });
    }

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    public async cleanUpBetweenEpoch(): Promise<void> {
        // del only states on all instances
        for (let i = 1; i <= 4; i++) {
            await this.delStates(Math.ceil(this.adapter.config.iterations / 4), i);
        }
    }

    /**
     * Clean up the db, remove insatnces, etc.
     */
    public async cleanUp(): Promise<void> {
        await this.adapter.unsubscribeForeignStatesAsync('benchmark.*');
        // delete instances
        this.adapter.log.info('Deleting 4 instances');
        await this.removeInstances(4);
    }
}
