'use strict';

/**
 * useAppState — lightweight reactive state for Dolphin screens.
 *
 * @param {*} initial  Initial value
 * @returns [getValue, setValue]
 */
function useAppState(initial) {
    let _value = initial;
    const listeners = [];

    const getValue = () => _value;

    const setValue = (next) => {
        _value = typeof next === 'function' ? next(_value) : next;
        listeners.forEach(fn => fn(_value));
    };

    const subscribe = (fn) => {
        listeners.push(fn);
        return () => {
            const i = listeners.indexOf(fn);
            if (i !== -1) listeners.splice(i, 1);
        };
    };

    return { getValue, setValue, subscribe };
}

module.exports = { useAppState };
