"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Transducers_1 = __importDefault(require("./Transducers"));
const sinon_1 = __importDefault(require("sinon"));
const { seq, into, map, flatMap, filter, reduce, Reduced, dedupe, take, skip, takeUntil, skipWhile } = Transducers_1.default;
const rambda_1 = require("rambda");
const chai_1 = require("chai");
describe('transducers', function () {
    describe('creation of on the spot transducer', function () {
        it('makes use of an on-the-spot creation', () => {
            const nth = (iteration, init = 0) => reducer => ({
                result: reducer.result,
                step: (acc, curr) => init++ < iteration ? reducer.step(acc, curr) : Reduced(acc)
            });
            const arr = [...Array(10).keys()];
            const result = into([], rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2), nth(2)), arr);
            chai_1.assert.deepEqual(result, [0, 10]);
        });
    });
    describe('Current and Accumulate for everyone', function () {
        it('Receives current and accumulate on filter', () => {
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 1, f: 3 };
            const result = seq(filter(([, value], accumulate) => {
                chai_1.assert.isObject(accumulate);
                return !Object.values(accumulate).includes(value);
            }), obj);
            chai_1.assert.deepEqual(result, { a: 1, b: 2, c: 3, d: 4 });
        });
    });
    describe('Arrays', function () {
        describe('flatMap', function () {
            it('flats and map an array', () => {
                const arr = [1, 2, [3, 4, 5], 6, 7, 8, 9];
                const res = seq(flatMap((x) => x * 2));
                chai_1.assert.isFunction(res);
                const result = res(arr);
                chai_1.assert.deepEqual(result, [2, 4, 6, 8, 10, 12, 14, 16, 18]);
            });
            it('works with whileReducer after flatMap', () => {
                const arr = [1, 2, [3, 4, 5], 6, 7, 8, 9];
                const res = seq(rambda_1.compose(flatMap((x) => x * 2), takeUntil(x => x !== 8)));
                chai_1.assert.isFunction(res);
                const result = res(arr);
                chai_1.assert.deepEqual(result, [2, 4, 6]);
            });
            it('works with whileReducer before flatMap', () => {
                const arr = [1, 2, [3, 4, 5], 6, 7, 8, 9];
                const res = seq(rambda_1.compose(takeUntil(x => x !== 6), flatMap((x) => x * 2)));
                chai_1.assert.isFunction(res);
                const result = res(arr);
                chai_1.assert.deepEqual(result, [2, 4, 6, 8, 10]);
            });
        });
        describe('seq', function () {
            it('accepts curring', () => {
                const arr = [...Array(10).keys()];
                const res = seq(rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2)));
                chai_1.assert.isFunction(res);
                const result = res(arr);
                chai_1.assert.deepEqual(result, [0, 10, 20, 30, 40]);
            });
            it('reduces the operations with functional params order', () => {
                const arr = [...Array(10).keys()];
                const result = seq(rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2)), arr); //?.$
                chai_1.assert.deepEqual(result, [0, 10, 20, 30, 40]);
            });
        });
        describe('reduce', function () {
            it('works with a seq, compose', () => {
                const arr = [...Array(10).keys()];
                const result = seq(rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2), reduce((accumulate, current) => accumulate + current, 0)), arr); //?.$
                chai_1.assert.equal(result, 100);
            });
        });
        describe('into', function () {
            it('accepts curring', () => {
                const arr = [...Array(10).keys()];
                const res = into([], rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2)));
                chai_1.assert.isFunction(res);
                const result = res(arr);
                chai_1.assert.deepEqual(result, [0, 10, 20, 30, 40]);
            });
            it('reduces the operations with functional params order', () => {
                const arr = [...Array(10).keys()];
                const result = into([], rambda_1.compose(filter((num) => num % 2 === 0), map((num) => num * 10), map((num) => num / 2)), arr);
                chai_1.assert.deepEqual(result, [0, 10, 20, 30, 40]);
            });
        });
        describe('dedupe', function () {
            it('Does nothing if values are not duped', () => {
                const arr = [...Array(10).keys()];
                const result = seq(rambda_1.compose(dedupe()), arr);
                chai_1.assert.deepEqual(result, arr);
            });
            it('dedupes consecutive values from a stream of data', () => {
                const arr = [0, 0, 1, 2, 2, 3, 4, 2, 3, 1, 2, 2, 0];
                const result = seq(rambda_1.compose(dedupe()), arr);
                chai_1.assert.deepEqual(result, [0, 1, 2, 3, 4, 2, 3, 1, 2, 0]);
            });
            it('dedupes values from all data streamed so far', () => {
                const arr = [0, 0, 1, 2, 2, 3, 4, 2, 3, 1, 2, 2, 0];
                const result = seq(rambda_1.compose(dedupe(true)), arr);
                chai_1.assert.deepEqual(result, [0, 1, 2, 3, 4]);
            });
        });
        describe('take', function () {
            it('takes from a stream of data starting on one element for a count of elements', () => {
                const arr = [...Array(10).keys()];
                chai_1.assert.deepEqual(seq(rambda_1.compose(take()), arr), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                chai_1.assert.deepEqual(seq(rambda_1.compose(take(2)), arr), [0, 1]);
            });
        });
        describe('skip', function () {
            it('takes from a stream of data starting on one element for a count of elements', () => {
                const arr = [...Array(10).keys()];
                chai_1.assert.deepEqual(seq(rambda_1.compose(skip()), arr), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                chai_1.assert.deepEqual(seq(rambda_1.compose(skip(2)), arr), [2, 3, 4, 5, 6, 7, 8, 9]);
            });
        });
        describe('takeUntil', function () {
            it('takes from a stream of data while condition is true', () => {
                const spy1 = sinon_1.default.spy();
                const spy2 = sinon_1.default.spy();
                const arr = [...Array(100).keys()];
                const fn = seq(rambda_1.compose(map(x => { spy1(); return x; }), takeUntil(v => v !== 4), map(x => { spy2(); return x; })));
                const res = fn(arr);
                chai_1.assert.deepEqual(res, [0, 1, 2, 3]);
                chai_1.assert.equal(spy1.callCount, 5);
                chai_1.assert.equal(spy2.callCount, 4);
                spy1.resetHistory();
                spy2.resetHistory();
                const res2 = fn([0, 3, 4, 3, 2, 3, 4, 4]);
                chai_1.assert.deepEqual(res2, [0, 3]);
                chai_1.assert.equal(spy1.callCount, 3);
                chai_1.assert.equal(spy2.callCount, 2);
            });
        });
        describe('skipWhile', function () {
            it('takes from a stream of data starting on one element for a count of elements', () => {
                const arr = [...Array(10).keys()];
                chai_1.assert.deepEqual(seq(rambda_1.compose(skipWhile(v => v !== 4)), arr), [4, 5, 6, 7, 8, 9]);
            });
        });
    });
    describe('Objects', function () {
        describe('seq', function () {
            it('accepts curring', () => {
                const obj = [...Array(10).keys()].reduce((acc, curr) => { acc[curr] = curr; return acc; }, {});
                const res = seq(rambda_1.compose(filter(([, value]) => value % 2 === 0), map(([key, value]) => [key, value * 10]), map(([key, value]) => [key, value / 2])));
                chai_1.assert.isFunction(res);
                const result = res(obj);
                chai_1.assert.deepEqual(result, { 0: 0, 2: 10, 4: 20, 6: 30, 8: 40 });
            });
            it('reduces the operations with functional params order', () => {
                const obj = [...Array(10).keys()].reduce((acc, curr) => { acc[curr] = curr; return acc; }, {});
                const result = seq(rambda_1.compose(filter(([, value]) => value % 2 === 0), map(([key, value]) => [key, value * 10]), map(([key, value]) => [key, value / 2])), obj); //?.$
                chai_1.assert.deepEqual(result, { 0: 0, 2: 10, 4: 20, 6: 30, 8: 40 });
            });
        });
        describe('reduce', function () {
            it('works with a seq, compose', () => {
                const obj = [...Array(10).keys()].reduce((acc, curr) => { acc[curr] = curr; return acc; }, {});
                const result = seq(rambda_1.compose(filter(([, value]) => value % 2 === 0), map(([key, value]) => [key, value * 10]), map(([key, value]) => [key, value / 2]), reduce((accumulate, [, value]) => accumulate + value, 0)), obj); //?.$
                chai_1.assert.equal(result, 100);
            });
        });
        describe('into', function () {
            it('Adds the processed elements into another object', () => {
                const obj = { a: 1, b: 2, c: 3, d: 4 };
                const result = into({}, rambda_1.compose(filter(([, value]) => value % 2 === 0), map(([key, value]) => [key, value * 10]), map(([key, value]) => [key, value / 2])), obj);
                chai_1.assert.deepEqual(result, { b: 10, d: 20 });
            });
        });
    });
});
//# sourceMappingURL=Transducers.test.js.map