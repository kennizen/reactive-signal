type CbMapVal<T extends (...args: Parameters<T>) => ReturnType<T> = (...args: any[]) => any> = {
  cb: T;
  args: Parameters<T>;
};

class CreateReactiveSignal<T extends Record<string, any>> {
  private cbMap: Map<string, CbMapVal[]>;
  private oriObj: T;
  private proxy: T;

  constructor(data: T) {
    this.cbMap = new Map();
    this.oriObj = data;
    this.proxy = new Proxy(this.oriObj, this.proxyHandler());
  }

  private proxyHandler(): ProxyHandler<T> {
    const map = this.cbMap;
    return {
      set(target, prop, receiver) {
        if (map.has(prop as string) && JSON.stringify(target[prop as string]) !== JSON.stringify(receiver)) {
          for (const item of map.get(prop as string)!) {
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

  setData(data: T) {
    for (const key in data) {
      this.proxy[key] = data[key];
    }
  }

  watchProp<T extends (...args: Parameters<T>) => ReturnType<T>>(prop: keyof typeof this.oriObj, handler: CbMapVal<T>) {
    if (this.cbMap.has(prop as string)) {
      const tmpArr = this.cbMap.get(prop as string);
      tmpArr?.push(handler);
      this.cbMap.set(prop as string, tmpArr!);
    } else {
      this.cbMap.set(prop as string, [handler]);
    }
  }

  removeWatch<T extends (...args: Parameters<T>) => ReturnType<T>>(
    prop: keyof typeof this.oriObj,
    handler: CbMapVal<T>
  ) {
    if (!this.cbMap.has(prop as string)) return;

    const handlerArr = this.cbMap.get(prop as string);

    if (!handlerArr) return;

    const handlerIdx = handlerArr.findIndex((h) => h.cb === handler.cb || h.cb.toString() === handler.cb.toString());

    if (handlerIdx < 0) return;

    handlerArr.splice(handlerIdx, 1);
  }
}

const sig = new CreateReactiveSignal({ name: "John wick", age: 40 });

console.log("data", sig.getData());

function cb(data: { msg: string }) {
  console.log(data.msg);
}

sig.watchProp("age", {
  cb: cb,
  args: [{ msg: "hello" }],
});

sig.setData({ ...sig.getData(), age: 45 });

console.log("data", sig.getData());

function newCb() {
  console.log("new func");
}

sig.watchProp("age", {
  cb: newCb,
  args: [],
});

sig.setData({ ...sig.getData(), name: "Deadpool" });

console.log("data", sig.getData());

sig.setData({ ...sig.getData(), age: 50 });

console.log("data", sig.getData());

sig.removeWatch("age", {
  cb: newCb,
  args: [],
});

sig.setData({ ...sig.getData(), age: 30 });

console.log("data", sig.getData());
