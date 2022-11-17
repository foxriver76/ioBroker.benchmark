import { Test as setStates } from './activeTests/setStates';
import { Test as statesSubscription } from './activeTests/statesSubscription';
import { Test as statesDeletion } from './activeTests/statesDeletion';
import { Test as idle } from './activeTests/idle';
import { Test as objectsCreation } from './activeTests/objectsCreation';
import { Test as setStatesNonStrict } from './activeTests/setStatesNonStrict';
import { Test as objectsDeletion } from './activeTests/objectsDeletion';
import { Test as getStates } from './activeTests/getStates';
import { Test as messages } from './activeTests/messages';
import { Test as getStatesAlias } from './activeTests/getStatesAlias';
import { Test as getStatesAliasRead } from './activeTests/getStatesAliasRead';
import { Test as statesSubscriptionAlias } from './activeTests/statesSubscriptionAlias';
import { Test as statesSubscriptionAliasWrite } from './activeTests/statesSubscriptionAliasWrite';
import { Test as setStatesParallel } from './activeTests/setStatesParallel';
import { Test as objectViewEqual } from './activeTests/objectViewEqual';
import { Test as objectViewSmall } from './activeTests/objectViewSmall';
import { Test as objectViewLarge } from './activeTests/objectViewLarge';
import { Test as getStatesMulti } from './activeTests/getStatesMulti';
import { Test as getStatesMultiAlias } from './activeTests/getStatesMultiAlias';
import { TestUtils } from './testClass';

export const tests: Record<string, new (...args: any[]) => TestUtils> = {
    setStates,
    statesSubscription,
    statesSubscriptionAlias,
    statesSubscriptionAliasWrite,
    statesDeletion,
    idle,
    objectsCreation,
    objectsDeletion,
    setStatesNonStrict,
    getStates,
    getStatesAlias,
    getStatesAliasRead,
    messages,
    setStatesParallel,
    objectViewEqual,
    objectViewSmall,
    objectViewLarge,
    getStatesMulti,
    getStatesMultiAlias
};
