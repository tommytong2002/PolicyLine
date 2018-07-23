import {
    parseExp,
    executeExp,
    registerOperator,
    unregisterOperator,
    unregisterMutator,
    registerMutator,
    getOperators
} from './target';
import {
    composeCondition
} from './condition';

const _property = Symbol(); // inner property name
const USER = 'user.';
const RESOURCE = 'resource.';

function checkOperand(oper, objStr) {
    return oper.isDIObj && oper.value.indexOf && oper.value.indexOf(objStr) === 0;
}

class Policy {

    // static merge(expression, policies) {
    //     // todo
    // }

    /**
     * Create a Policy object by JSON rules.
     * @param {object} jsonPolicy - Plain javascript object, which contain policy rules in JSON like structure.
     */
    constructor(jsonPolicy) {
        let tempObj;
        const parsedRules = [];
        const operators = getOperators();

        // create hidden container for save any instance date
        this[_property] = {
            effect: jsonPolicy.effect !== 'deny',
            target: [],
            condition: [],
            watcher: [],
            lastData: null
        };

        // construction part
        // if (jsonPolicy.expression) {
        //     // todo
        //     console.error('not implemented!');
        // } else {

        for (let expStr of jsonPolicy.target) {
            parsedRules.push(parseExp(expStr));
        }

        for (let exp of parsedRules) {
            // fill conditions
            if (checkOperand(exp.left, RESOURCE)) {
                this[_property].condition.push(exp);
            } else if (checkOperand(exp.right, RESOURCE)) {
                tempObj = exp.right;
                exp.right = exp.left;
                exp.left = tempObj;
                exp.operator = operators[exp.operator].reverse;
                this[_property].condition.push(exp);
            } else {
                this[_property].target.push(exp);
            }


            // todo fill watchers
            if (checkOperand(exp.left, USER)) {
            } else if (checkOperand(exp.right, USER)) {
            }
        }


        //this[_property].target = parsedRules;
        // }
    }

    /**
     * Check params object by policy rules, which was setted in constructor.
     * @param {object} data - Object should contain four objects as attributes:
     * `user`, `action`, `env`, `resource`
     *
     * @returns {boolean} `true` in permit case, `false` in deny case.
     */
    check(data) {
        const context = {}, results = {};
        let key, tmp;

        // save data for next `getConditions` & `getWatchers`
        this[_property].lastData = data;

        // execute expressions(targets)
        for (let targetExp of this[_property].target) {
            // generate unique random key
            key = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

            tmp = executeExp(data, targetExp, context, key);
            if (typeof tmp === 'boolean') {
                results[key] = tmp;
            } else {
                Object.assign(results, tmp);
            }
        }

        // calculate final result
        let result = true;
        Object.values(results).forEach((value) => {
            result = result && value;
        });

        // apply effect to result & return
        return this[_property].effect ? result : !result;
    }

    /**
     * Function return object with condition.
     * @param {object} adapter - Adapter, by default - for JSONB
     * @returns {object}
     */
    getConditions(adapter) {
        // const conditions = [];
        // for (let expr of this[_property].condition) {
        //     conditions.push(composeCondition(expr));
        // }
        //
        // return conditions;
        const context = {}, results = {};
        let key, tmp;

        // save data for next `getConditions` & `getWatchers`
        const data = this[_property].lastData;

        // execute expressions(targets)
        for (let expr of this[_property].condition) {
            // generate unique random key
            key = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

            tmp = composeCondition(data, expr, context, key);

            if (typeof tmp === 'boolean') {
                results[key] = tmp;
            } else {
                Object.assign(results, tmp);
            }
        }

        // // calculate final result
        // let result = true;
        // Object.values(results).forEach((value) => {
        //     result = result && value;
        // });
        //
        // // apply effect to result & return
        // return this[_property].effect ? result : !result;
        return results;
        }

    // getWatchers({user, action, env, resource}) {
    //     return null;
    // }

}

export {
    Policy,
    registerOperator,
    unregisterOperator,
    registerMutator,
    unregisterMutator
}