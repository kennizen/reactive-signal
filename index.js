"use strict";
function createSignal(initVal) {
    const cbMap = new Map();
    const oriObj = initVal;
    const val = new Proxy(oriObj, {
        set(target, prop, receiver) {
            if (cbMap.has(prop) && JSON.stringify(target[prop]) !== JSON.stringify(receiver)) {
                for (const item of cbMap.get(prop)) {
                    item.cb(...item.args);
                }
            }
            return Reflect.set(target, prop, receiver);
        },
    });
    function getData() {
        return oriObj;
    }
    function setData(data) {
        for (const key in data) {
            val[key] = data[key];
        }
    }
    function watchProp(prop, data) {
        if (cbMap.has(prop)) {
            const tmpArr = cbMap.get(prop);
            tmpArr === null || tmpArr === void 0 ? void 0 : tmpArr.push(data);
            cbMap.set(prop, tmpArr);
        }
        else {
            cbMap.set(prop, [data]);
        }
    }
    return { getData, setData, watchProp };
}
const { getData, setData, watchProp } = createSignal({ num: 10, name: "john" });
console.log("data", getData());
setData(Object.assign(Object.assign({}, getData()), { name: "wick" }));
console.log("data", getData());
function cb(data) {
    console.log(data.msg);
}
watchProp("num", {
    cb: cb,
    args: [{ msg: "hello" }],
});
watchProp("name", {
    cb: () => {
        console.log("2nd");
    },
    args: [],
});
setData(Object.assign(Object.assign({}, getData()), { num: 40 }));
console.log("data", getData());
setData(Object.assign(Object.assign({}, getData()), { name: "john" }));
console.log("data", getData());
setData(Object.assign(Object.assign({}, getData()), { num: 40 }));
