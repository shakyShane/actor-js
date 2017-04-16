(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = (typeof window !== "undefined" ? window['Rx'] : typeof global !== "undefined" ? global['Rx'] : null);
var Immutable = (typeof window !== "undefined" ? window['Immutable'] : typeof global !== "undefined" ? global['Immutable'] : null);
var BehaviorSubject = Rx.BehaviorSubject;
var Subject = Rx.Subject;
function createStore(initialState, initialReducers, initialEffects, initialMiddleware, initialExtras) {
    var mergedInitialState = alwaysMap(initialState);
    var state$ = new BehaviorSubject(mergedInitialState);
    var userExtra$ = new BehaviorSubject({});
    var newExtras$ = new Subject();
    newExtras$.scan(function (extras, incoming) {
        return Object.assign({}, extras, incoming);
    }, {}).share().subscribe(userExtra$);
    // stream of actions
    var action$ = new Subject();
    // reducers to act upon state
    var storeReducers = new BehaviorSubject([]);
    var newReducer$ = new Subject();
    newReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).share().subscribe(storeReducers);
    // Mapped reducers
    var mappedReducers = new BehaviorSubject([]);
    var newMappedReducer$ = new Subject();
    newMappedReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).share().subscribe(mappedReducers);
    // responses
    var storeResponses = new BehaviorSubject([]);
    var newResponses = new Subject();
    newResponses.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).share().subscribe(storeResponses);
    // stream
    var stateUpdate$ = action$
        .do(function (action) {
        if (!isPlainObject(action)) {
            return console.error('Please provide an object with at least a `type` property');
        }
        if ((typeof action.type) !== 'string') {
            return console.error('Action was missing a `type` property', action);
        }
    })
        .withLatestFrom(storeReducers, mappedReducers, function (action, reducers, mappedReducers) {
        var mappedReducersThatMatchAction = mappedReducers
            .filter(function (reducer) {
            return reducer.name === action.type;
        });
        return {
            action: action,
            reducers: mappedReducersThatMatchAction.concat(reducers),
        };
    })
        .scan(function (stateMap, _a) {
        var action = _a.action, reducers = _a.reducers;
        var actionType = action.type || (typeof action === 'string' ? action : '');
        // is it a @@namespace ?
        if (actionType.indexOf('@@NS-INIT') === 0) {
            return stateMap.setIn(action.payload.path, alwaysMap((action.payload || {}).value));
        }
        else {
            return reducers.reduce(function (outgoingValue, reducer) {
                return outgoingValue.updateIn(reducer.path, function (currentValue) {
                    return reducer.fns.reduce(function (value, fn) {
                        return fn.call(null, value, action, outgoingValue);
                    }, currentValue);
                });
            }, stateMap);
        }
    }, mergedInitialState).share();
    // Push all state updates back onto state$ value
    stateUpdate$
        .catch(function (err) {
        // console.error(err);
        return Rx.Observable.throw(err);
    })
        .subscribe(state$);
    /**
     * Create a stream that has updates + resulting state updates
     */
    var actionsWithState$ = action$.withLatestFrom(state$, function (action, state) {
        return {
            action: action,
            state: state
        };
    });
    var storeExtras = {
        state$: state$,
        action$: action$,
        actionsWithState$: actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$
    };
    /**
     * Setup responses for declarative cross-domain communication
     */
    actionsWithState$
        .withLatestFrom(storeResponses)
        .filter(function (_a) {
        var _ = _a[0], storeResponses = _a[1];
        return storeResponses.length > 0;
    })
        .flatMap(function (incoming) {
        var _a = incoming[0], action = _a.action, state = _a.state;
        var storeResponses = incoming[1];
        var actionName = action.type;
        var matchingResponses = storeResponses
            .filter(function (response) { return response.name === actionName; });
        var newActions = matchingResponses.map(function (x) {
            return {
                type: x.targetName,
                payload: state.getIn(x.path, getMap({})).toJS(),
                via: "[response to (" + actionName + ")]"
            };
        });
        return Rx.Observable.from(newActions);
    })
        .subscribe(function (action) { return _dispatcher(action); });
    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    function _dispatcher(action) {
        if (Array.isArray(action)) {
            return action.forEach(function (a) {
                action$.onNext(a);
            });
        }
        return action$.onNext(action);
    }
    /**
     * Add either plain functions or {path, fns} pairs
     * @param reducers
     * @private
     */
    function _addReducers(reducers) {
        alwaysArray(reducers).forEach(function (reducer) {
            if (typeof reducer === 'function') {
                newReducer$.onNext({
                    path: [],
                    fns: [].concat(reducer).filter(Boolean)
                });
            }
            if (isPlainObject(reducer)) {
                if (reducer.state) {
                    if (reducer.reducers) {
                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        Object.keys(reducer.state).forEach(function (stateKey) {
                            _addReducers({ path: stateKey, fns: reducer.reducers });
                        });
                    }
                    if (reducer.effects) {
                        _addEffects(reducer.effects);
                    }
                    /**
                     *
                     */
                    _registerOnStateTree(reducer.state);
                    return;
                }
                if (reducer.path && reducer.reducers) {
                    Object.keys(reducer.reducers).forEach(function (name) {
                        var currentFn = reducer.reducers[name];
                        newMappedReducer$.onNext({
                            path: [].concat(reducer.path),
                            fns: [currentFn],
                            name: name
                        });
                    });
                    return;
                }
                /**
                 * if path/fn pairs given
                 */
                if (reducer.path && reducer.fns) {
                    newReducer$.onNext({
                        path: [].concat(reducer.path).filter(Boolean),
                        fns: [].concat(reducer.fns).filter(Boolean)
                    });
                }
                else {
                    // redux style key: fn pairs
                    for (var key in reducer) {
                        newReducer$.onNext({
                            path: [].concat(key).filter(Boolean),
                            fns: [].concat(reducer[key]).filter(Boolean)
                        });
                    }
                }
            }
        });
    }
    function _addEffects(effects) {
        var actionsApi = {
            ofType: function (actionName) {
                return actionsWithState$.filter(function (incoming) {
                    return incoming.action.type === actionName;
                });
            }
        };
        var extras = Object.assign({}, storeExtras, userExtra$.getValue());
        alwaysArray(effects).forEach(function (effect) {
            effect.call(null, actionsApi, extras)
                .map(function (action) {
                return __assign({}, action, { via: '[effect]', name: (effect.name || '') });
            })
                .forEach(function (action) {
                _dispatcher(action);
            });
        });
    }
    function _addMiddleware(middleware) {
        alwaysArray(middleware).forEach(function (middleware) {
            middleware.call(null, api);
        });
    }
    function _addExtras(extras) {
        alwaysArray(extras).forEach(function (extra) {
            newExtras$.onNext(extra);
        });
    }
    function _registerOnStateTree(state) {
        for (var key in state) {
            // now init with action
            _dispatcher({
                type: '@@NS-INIT(' + key + ')',
                payload: {
                    path: [key],
                    value: state[key]
                }
            });
        }
    }
    function _addResponses(responses) {
        alwaysArray(responses).forEach(function (resp) {
            Object.keys(resp).forEach(function (actionName) {
                var item = resp[actionName];
                newResponses.onNext({
                    name: actionName,
                    path: [].concat(item.path).filter(Boolean),
                    targetName: item.action
                });
            });
        });
    }
    var api = {
        state$: state$,
        action$: action$,
        actionsWithState$: actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$,
        register: function (input) {
            var state = input.state, reducers = input.reducers, effects = input.effects, responses = input.responses;
            if (reducers) {
                _addReducers(reducers);
            }
            if (effects) {
                _addEffects(effects);
            }
            if (state) {
                _registerOnStateTree(state);
            }
            if (responses) {
                _addResponses(responses);
            }
            return api;
        },
        addReducers: function (reducers) {
            _addReducers(reducers);
            return api;
        },
        dispatch: function (action) {
            _dispatcher(action);
            return api;
        },
        getState: function (path) {
            var lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({}));
        },
        toJS: function (path) {
            var lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({})).toJS();
        },
        toJSON: function (path) {
            var lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({})).toJSON();
        },
        addMiddleware: function (middleware) {
            _addMiddleware(middleware);
            return api;
        },
        once: function (actions) {
            var lookup = alwaysArray(actions);
            return actionsWithState$.filter(function (x) {
                return lookup.indexOf(x.action.type) > -1;
            }).take(1);
        },
        changes: function (path) {
            var lookup = alwaysArray(path);
            return state$.map(function (x) { return x.getIn(lookup); })
                .distinctUntilChanged()
                .skip(1);
        }
    };
    // add initial ones
    _addReducers(initialReducers);
    _addEffects(initialEffects);
    _addMiddleware(initialMiddleware);
    _addExtras(initialExtras);
    function alwaysMap(input) {
        return Immutable.Map.isMap(input) ? input : Immutable.fromJS(input || {});
    }
    function alwaysArray(input) {
        return [].concat(input).filter(Boolean);
    }
    function isPlainObject(value) {
        var objectTag = '[object Object]';
        return Object.prototype.toString.call(value) === objectTag;
    }
    function getMap(incoming) {
        return Immutable.Map(incoming);
    }
    return api;
}
exports.createStore = createStore;
exports.default = createStore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
