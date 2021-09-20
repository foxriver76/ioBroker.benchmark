import {Test as setStates} from './activeTests/setStates';
import {Test as statesSubscription} from './activeTests/statesSubscription';
import {Test as statesDeletion} from './activeTests/statesDeletion';
import {Test as idle} from './activeTests/idle';
import {Test as objectsCreation} from './activeTests/objectsCreation';
import {Test as setStatesNonStrict} from './activeTests/setStatesNonStrict';
import {TestUtils} from './testClass';

export const tests: Record<string, (new (...args: any[]) => TestUtils)> = {
	setStates,
	statesSubscription,
	statesDeletion,
	idle,
	objectsCreation,
	setStatesNonStrict
};
