type CbMapVal<T extends (...args: Parameters<T>) => ReturnType<T> = (...args: any[]) => any> = {
  cb: T;
  args: Parameters<T>;
};

function createSignal<T extends Record<string, any>>(initVal: T) {
  const cbMap = new Map<string, CbMapVal[]>();
  const oriObj = initVal;

  const val = new Proxy(oriObj, {
    set(target, prop, receiver) {
      if (cbMap.has(prop as string) && JSON.stringify(target[prop as string]) !== JSON.stringify(receiver)) {
        for (const item of cbMap.get(prop as string)!) {
          item.cb(...item.args);
        }
      }
      return Reflect.set(target, prop, receiver);
    },
  });

  function getData() {
    return oriObj;
  }

  function setData(data: T) {
    for (const key in data) {
      val[key] = data[key];
    }
  }

  function watchProp<T extends (...args: Parameters<T>) => ReturnType<T>>(
    prop: keyof typeof oriObj,
    data: CbMapVal<T>
  ) {
    if (cbMap.has(prop as string)) {
      const tmpArr = cbMap.get(prop as string);
      tmpArr?.push(data);
      cbMap.set(prop as string, tmpArr!);
    } else {
      cbMap.set(prop as string, [data]);
    }
  }

  return { getData, setData, watchProp };
}

const { getData, setData, watchProp } = createSignal({ num: 10, name: "john" });

console.log("data", getData());

setData({ ...getData(), name: "wick" });

console.log("data", getData());

function cb(data: { msg: string }) {
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

setData({ ...getData(), num: 40 });

console.log("data", getData());

setData({ ...getData(), name: "john" });

console.log("data", getData());
setData({ ...getData(), num: 40 });
