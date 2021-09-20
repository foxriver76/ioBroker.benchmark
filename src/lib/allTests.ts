import {Test as statesCreation} from './activeTests/statesCreation';
import {Test as statesSubscription} from './activeTests/statesSubscription';
import {Test as statesDeletion} from './activeTests/statesDeletion';

export const tests: Record<string, any> = {
	statesCreation,
	statesSubscription,
	statesDeletion
};
