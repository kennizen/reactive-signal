var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Reactive = /** @class */ (function () {
    /**
     * Proxy initialization in the constructor
     */
    function Reactive(data) {
        this.cbMap = new Map();
        this.oriObj = data;
        this.proxy = new Proxy(this.oriObj, this.proxyHandler());
    }
    /**
     * Proxy handler where the internal object method 'set' is intercepted to perform reactive side effects.
     */
    Reactive.prototype.proxyHandler = function () {
        var map = this.cbMap;
        return {
            set: function (target, prop, receiver) {
                if (map.has(prop) && JSON.stringify(target[prop]) !== JSON.stringify(receiver)) {
                    // reflect namespace used for default behaviour
                    Reflect.set(target, prop, receiver);
                    for (var _i = 0, _a = map.get(prop); _i < _a.length; _i++) {
                        var item = _a[_i];
                        item.cb.apply(item, item.args);
                    }
                }
                return Reflect.set(target, prop, receiver);
            },
        };
    };
    /**
     * Getter to get the original object
     */
    Reactive.prototype.getData = function () {
        return structuredClone(this.oriObj);
    };
    /**
     * Setter to update the object data
     */
    Reactive.prototype.setData = function (data) {
        var resp = null;
        try {
            for (var key in data) {
                if (!(key in this.proxy))
                    throw new Error("Argument passed does not match the internal object.");
                this.proxy[key] = data[key];
            }
        }
        catch (error) {
            resp = error;
        }
        return resp;
    };
    /**
     * Watch method to subscribe to an object prop for changes
     */
    Reactive.prototype.subscribe = function (prop, handler) {
        if (this.cbMap.has(prop)) {
            var tmpArr = this.cbMap.get(prop);
            tmpArr === null || tmpArr === void 0 ? void 0 : tmpArr.push(handler);
            this.cbMap.set(prop, tmpArr);
        }
        else {
            this.cbMap.set(prop, [handler]);
        }
    };
    /**
     * Method to unsubscribe
     */
    Reactive.prototype.unsubscribe = function (prop, handler) {
        var resp = null;
        try {
            if (!this.cbMap.has(prop))
                throw new Error("Prop not found.");
            var handlerArr = this.cbMap.get(prop);
            if (!handlerArr)
                throw new Error("Callback array not found.");
            var handlerIdx = handlerArr.findIndex(function (h) { return h.cb === handler || h.cb.toString() === handler.toString(); });
            if (handlerIdx < 0)
                throw new Error("Handler not found.");
            handlerArr.splice(handlerIdx, 1);
        }
        catch (error) {
            resp = error;
        }
        return resp;
    };
    return Reactive;
}());
/**
 * ---------------------------------------- Usage examples ----------------------------------------
 */
var person = {
    info: {
        firstname: "John",
        lastname: "Doe",
        age: 40,
    },
    job: {
        location: "onsite",
    },
};
/**
 * Object for the reactive class
 */
var employee = new Reactive(person);
/**
 * Handlers that will be used to subscribe to a prop in the init object
 */
function printNewLocation(zipcode) {
    console.log("New job location is ".concat(employee.getData().job.location, " with zipcode ").concat(zipcode));
}
function printNewName() {
    console.log("New name is ".concat(employee.getData().info.firstname, " ").concat(employee.getData().info.lastname));
}
/**
 * Subscribing to the job prop of the init object
 */
employee.subscribe("job", {
    cb: printNewLocation,
    args: ["123456"],
});
/**
 * Subscribing to the info prop of the init object
 */
employee.subscribe("info", {
    cb: printNewName,
    args: [],
});
/**
 * After subscribing when we set new data for any of the subcscribed prop the handlers
 * used for subscribtion will be executed
 */
employee.setData(__assign(__assign({}, employee.getData()), { job: { location: "remote" } }));
employee.setData(__assign(__assign({}, employee.getData()), { info: __assign(__assign({}, employee.getData().info), { firstname: "Jhonny" }) }));
/**
 * Unsubscribing from the job prop
 * So now even if we update the job property of the object with new data
 * the handler will no be executed.
 */
employee.unsubscribe("job", printNewLocation);
/**
 * After this line you will see that the 'printNewLocation' handler is not invoked
 */
employee.setData(__assign(__assign({}, employee.getData()), { job: { location: "onsite" } }));
