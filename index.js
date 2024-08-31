"use strict";
class CreateReactiveSignal {
    constructor(data) {
        this.cbMap = new Map();
        this.oriObj = data;
        this.proxy = new Proxy(this.oriObj, this.proxyHandler());
    }
    proxyHandler() {
        const map = this.cbMap;
        return {
            set(target, prop, receiver) {
                if (map.has(prop) && JSON.stringify(target[prop]) !== JSON.stringify(receiver)) {
                    for (const item of map.get(prop)) {
                        item.cb(...item.args);
                    }
                }
                return Reflect.set(target, prop, receiver);
            },
        };
    }
    getData() {
        return this.oriObj;
    }
    setData(data) {
        for (const key in data) {
            this.proxy[key] = data[key];
        }
    }
    watchProp(prop, handler) {
        if (this.cbMap.has(prop)) {
            const tmpArr = this.cbMap.get(prop);
            tmpArr === null || tmpArr === void 0 ? void 0 : tmpArr.push(handler);
            this.cbMap.set(prop, tmpArr);
        }
        else {
            this.cbMap.set(prop, [handler]);
        }
    }
    removeWatch(prop, handler) {
        if (!this.cbMap.has(prop))
            return;
        const handlerArr = this.cbMap.get(prop);
        if (!handlerArr)
            return;
        const handlerIdx = handlerArr.findIndex((h) => h.cb === handler.cb || h.cb.toString() === handler.cb.toString());
        if (handlerIdx < 0)
            return;
        handlerArr.splice(handlerIdx, 1);
    }
}
const sig = new CreateReactiveSignal({ name: "John wick", age: 40 });
console.log("data", sig.getData());
function cb(data) {
    console.log(data.msg);
}
sig.watchProp("age", {
    cb: cb,
    args: [{ msg: "hello" }],
});
sig.setData(Object.assign(Object.assign({}, sig.getData()), { age: 45 }));
console.log("data", sig.getData());
function newCb() {
    console.log("new func");
}
sig.watchProp("age", {
    cb: newCb,
    args: [],
});
sig.setData(Object.assign(Object.assign({}, sig.getData()), { name: "Deadpool" }));
console.log("data", sig.getData());
sig.setData(Object.assign(Object.assign({}, sig.getData()), { age: 50 }));
console.log("data", sig.getData());
sig.removeWatch("age", {
    cb: newCb,
    args: [],
});
sig.setData(Object.assign(Object.assign({}, sig.getData()), { age: 30 }));
console.log("data", sig.getData());
