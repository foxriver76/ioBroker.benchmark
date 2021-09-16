import {Test as statesCreation} from './activeTests/statesCreation';

interface testsObj {
	[x: string]: any // allow anonymous properties of type any
}

const tests: testsObj = {
	statesCreation
};

export { tests };
