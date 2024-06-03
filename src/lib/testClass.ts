import { exec as execAsync } from 'promisify-child-process';
import { AdapterInstance } from '@iobroker/adapter-core';

export interface TestRequirements {
    controllerVersion?: string;
    freeMemory?: number;
}

export abstract class TestUtils {
    public adapter: AdapterInstance;
    public readonly requirements: TestRequirements;
    private readonly iobExecutable: string;

    protected constructor(adapter: AdapterInstance, requirements?: TestRequirements) {
        this.adapter = adapter;
        this.requirements = requirements || {};
        this.iobExecutable = require.resolve('iobroker.js-controller/iobroker.js');
    }

    /**
     * Adds the desired number of instances in secondaryMode
     */
    public async addInstances(nInstances: number, host?: string): Promise<void> {
        for (let i = 1; i <= nInstances; i++) {
            await this.adapter.subscribeForeignStatesAsync(`system.adapter.benchmark.${i}.alive`);

            await execAsync(
                `"${process.execPath}" "${this.iobExecutable}" add benchmark ${i} --enabled false${
                    host ? ` --host ${host}` : ''
                }`
            );

            // give controller some time to actually start the instance so we check for alive state
            const stateChangePromise: () => Promise<void> = () => {
                return new Promise(resolve => {
                    const onStateChange: () => void = () => {
                        resolve();
                        this.adapter.removeListener('stateChange', onStateChange);
                    };

                    this.adapter.on('stateChange', onStateChange);

                    // enable instance in secondaryMode
                    const instObj = { common: { enabled: true }, native: { secondaryMode: true } };

                    this.adapter.extendForeignObject(`system.adapter.benchmark.${i}`, instObj);
                });
            };

            // wait until ready
            await stateChangePromise();

            await this.adapter.unsubscribeForeignStatesAsync(`system.adapter.benchmark.${i}.alive`);

            // and now we wait 500 ms just to be sure, that adapter is ready to receive messages
            await this.wait(500);
        }
    }

    /**
     * Removes the desired number of instances
     */
    public async removeInstances(nInstances: number): Promise<void> {
        for (let i = 1; i <= nInstances; i++) {
            await execAsync(`"${process.execPath}" "${this.iobExecutable}" del benchmark.${i}`);
        }
    }

    /**
     * Add state Objects at given instance
     *
     * @param n - number of objects to be added
     * @param instanceNumber - number of the benchmark instance to add objects at
     * @param prefix - prefix for ids
     */
    public async addObjects(n: number, instanceNumber: number, prefix = ''): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // set objects locally
            for (let i = 0; i < n; i++) {
                await this.adapter.setObjectAsync(`test.${prefix}${i}`, {
                    type: 'state',
                    common: {
                        name: i.toString(),
                        read: true,
                        write: true,
                        role: 'state',
                        type: 'number'
                    },
                    native: {}
                });
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', { cmd: 'set', n, prefix });
        }
    }

    /**
     * Subscribes n states at given instance, not implemented for primary
     * This performs n subscribe calls at the secondary
     *
     * @param n number of states to subscribe
     * @param instanceNumber the instance number of the secondary
     * @param prefix - prefix for ids
     */
    public async subscribeStates(n: number, instanceNumber: number, prefix = ''): Promise<void> {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', { cmd: 'subscribe', n, prefix });
    }

    /**
     * Wait until n publishes have been counted at the given secondary
     *
     * @param n number of states to subscribe
     * @param instanceNumber the instance number of the secondary
     */
    public async waitForStatePublish(n: number, instanceNumber: number): Promise<void> {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', { cmd: 'waitForPublish', n });
    }

    /**
     * Add meta Objects at controller instance
     *
     * @param n - number of objects to be added
     * @param prefix - prefix for ids
     */
    public async addMetaObjects(n: number, prefix = ''): Promise<void> {
        // set objects locally
        for (let i = 0; i < n; i++) {
            await this.adapter.setObjectAsync(`test.${prefix}${i}meta`, {
                type: 'meta',
                common: {
                    name: i.toString(),
                    type: 'meta.folder'
                },
                native: {}
            });
        }
    }

    /**
     * Add Alias Objects (source and target) at given instance
     *
     * @param n - number of objects to be added
     * @param instanceNumber - number of the benchmark instance to add objects at
     * @param prefix - prefix for ids
     * @param read - use read function
     * @param write - use write function
     * @param startIdx - offset for starting index
     */
    public async addAliasObjects(
        n: number,
        instanceNumber: number,
        prefix = '',
        read = false,
        write = false,
        startIdx = 0
    ): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // create object then alias locally
            for (let i = startIdx; i < startIdx + n; i++) {
                await this.adapter.setObjectAsync(`test.${prefix}${i}`, {
                    type: 'state',
                    common: {
                        name: i.toString(),
                        read: true,
                        write: true,
                        role: 'state',
                        type: 'number'
                    },
                    native: {}
                });

                const aliasObj: ioBroker.Object = {
                    _id: `alias.0.__benchmark.${prefix}${i}`,
                    type: 'state',
                    common: {
                        name: 'I am an alias',
                        read: true,
                        write: true,
                        role: 'state',
                        type: 'number',
                        alias: {
                            id: `${this.adapter.namespace}.test.${prefix}${i}`,
                            write: write ? 'val * 3' : undefined,
                            read: read ? 'val / 2' : undefined
                        }
                    },
                    native: {}
                };

                await this.adapter.setForeignObjectAsync(`alias.0.__benchmark.${prefix}${i}`, aliasObj);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {
                cmd: 'setAlias',
                n,
                prefix,
                read,
                write,
                startIdx
            });
        }
    }

    /**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
     * @param prefix - prefix for ids
     * @param startIdx - offset for setting first state
     */
    public async addStates(n: number, instanceNumber: number, prefix = '', startIdx = 0): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            for (let i = startIdx; i < n + startIdx; i++) {
                await this.adapter.setStateAsync(`test.${prefix}${i}`, i, true);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {
                cmd: 'set',
                n,
                prefix,
                startIdx
            });
        }
    }

    /**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
     * @param prefix - prefix for ids
     * @param startIdx - offset for setting first state
     */
    public async addAliasStates(n: number, instanceNumber: number, prefix = '', startIdx = 0): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            for (let i = startIdx; i < n + startIdx; i++) {
                await this.adapter.setForeignStateAsync(`alias.0.__benchmark.${prefix}${i}`, i, true);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {
                cmd: 'setAlias',
                n,
                prefix,
                startIdx
            });
        }
    }

    /**
     * Delete states at given instance
     *
     * @param n - number of states to be deleted
     * @param instanceNumber - number of the benchmark instance to delete states from
     * @param prefix - prefix for ids
     * @param startIdx - offset
     */
    public async delStates(n: number, instanceNumber: number, prefix = '', startIdx = 0): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // local
            for (let i = startIdx; i < n + startIdx; i++) {
                await this.adapter.delStateAsync(`test.${prefix}${i}`);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', {
                cmd: 'del',
                n,
                prefix,
                startIdx
            });
        }
    }

    /**
     * Delete objects (and states) at given instance
     *
     * @param n - number of objects to be deleted
     * @param instanceNumber - number of the benchmark instance to delete objects from
     * @param prefix - prefix for ids
     */
    public async delObjects(n: number, instanceNumber: number, prefix = ''): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // local
            for (let i = 0; i < n; i++) {
                await this.adapter.delObjectAsync(`test.${prefix}${i}`);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', { cmd: 'del', n, prefix });
        }
    }

    /**
     * Delete meta objects at controller instance
     *
     * @param n - number of objects to be deleted
     * @param prefix - prefix for ids
     */
    public async delMetaObjects(n: number, prefix = ''): Promise<void> {
        // local
        for (let i = 0; i < n; i++) {
            await this.adapter.delObjectAsync(`test.${prefix}${i}meta`);
        }
    }

    /**
     * Delete objects (and corresponding alias objects) at given instance
     *
     * @param n - number of objects to be deleted
     * @param instanceNumber - number of the benchmark instance to delete objects from
     * @param prefix - prefix for ids
     * @param startIdx - offset
     */
    public async delAliasObjects(n: number, instanceNumber: number, prefix = '', startIdx = 0): Promise<void> {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // del alias and then object
            for (let i = startIdx; i < n + startIdx; i++) {
                await this.adapter.delForeignObjectAsync(`alias.0.__benchmark.${prefix}${i}`);
                await this.adapter.delObjectAsync(`test.${prefix}${i}`);
            }
        } else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', {
                cmd: 'delAlias',
                n,
                prefix,
                startIdx
            });
        }
    }

    /**
     *	Get n states, only supported on local (controller) instance
     *
     * @param n - number of states to get
     * @param prefix - prefix for ids
     */
    public async getStates(n: number, prefix = ''): Promise<void> {
        for (let i = 0; i < n; i++) {
            await this.adapter.getStateAsync(`test.${prefix}${i}`);
        }
    }

    /**
     *	Get n states from alias, only supported on local (controller) instance
     *
     * @param n - number of states to get
     * @param prefix - prefix for ids
     */
    public async getStatesFromAlias(n: number, prefix = ''): Promise<void> {
        for (let i = 0; i < n; i++) {
            await this.adapter.getForeignStateAsync(`alias.0.__benchmark.${prefix}${i}`);
        }
    }

    /**
     * Send n messages to a given instance
     *
     * @param n - number of messages to be sent
     * @param instanceNumber - number of the benchmark instance to send messages too
     */
    public async sendMessages(n: number, instanceNumber: number): Promise<void> {
        for (let i = 0; i < n; i++) {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'testMessage', {
                ping: 'pong',
                pong: 'ping'
            });
        }
    }

    /**
     * Start measuring a foreign instance to (eventLoopLag, ram, cpu)
     *
     * @param instanceNumber - number of the benchmark instance to add states at
     */
    public async startMeasuringForeignInstance(instanceNumber: number): Promise<void> {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'startMeasuring', {});
    }

    /**
     * Stop measuring a foreign instance to (eventLoopLag, ram, cpu)
     *
     * @param instanceNumber - number of the benchmark instance to add states at
     */
    public async stopMeasuringForeignInstance(instanceNumber: number): Promise<void> {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'stopMeasuring', {});
    }

    /**
     * Prepare steps which are needed for tests to be executed before first test starts
     */
    abstract prepare(): Promise<void>;

    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    abstract prepareBetweenEpoch(): Promise<void>;

    /**
     * The tests itself
     */
    abstract execute(): Promise<void>;

    /**
     * Clean up everything which has been created
     */
    abstract cleanUp(): Promise<void>;

    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    abstract cleanUpBetweenEpoch(): Promise<void>;

    /**
     * Time to wait in ms
     */
    public async wait(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}
