import {Test as setStates} from './activeTests/setStates';
import {Test as statesSubscription} from './activeTests/statesSubscription';
import {Test as statesDeletion} from './activeTests/statesDeletion';
import {Test as idle} from './activeTests/idle';
import {Test as objectsCreation} from './activeTests/objectsCreation';
import {Test as setStatesNonStrict} from './activeTests/setStatesNonStrict';

// This is suboptimal, because you're losing the type information of your tests and doesn't catch downstream errors where a test is invoked incorrectly. I would:
// 1. define an interface (let's call it ITest) which has the public shape of your test class
// 2. make all tests implement that interface
// 3. export this as `Record<string, ITest>` (you could even get fancier, but that's good enough)

export const tests: Record<string, any> = {
	setStates,
	statesSubscription,
	statesDeletion,
	idle,
	objectsCreation,
	setStatesNonStrict
};
