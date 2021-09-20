import {Test as setStates} from './activeTests/setStates';
import {Test as statesSubscription} from './activeTests/statesSubscription';
import {Test as statesDeletion} from './activeTests/statesDeletion';
import {Test as idle} from './activeTests/idle';

export const tests: Record<string, any> = {
	setStates,
	statesSubscription,
	statesDeletion,
	idle
};
