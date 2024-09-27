type CbMapVal<T extends (...args: Parameters<T>) => ReturnType<T> = (...args: any[]) => any> = {
  cb: T;
  args: Parameters<T>;
};

class Reactive<T extends Record<string, any>, E extends Error> {
  private cbMap: Map<string, CbMapVal[]>;
  private oriObj: T;
  private proxy: T;

  /**
   * Proxy initialization in the constructor
   */
  constructor(data: T) {
    this.cbMap = new Map();
    this.oriObj = data;
    this.proxy = new Proxy(this.oriObj, this.proxyHandler());
  }

  /**
   * Proxy handler where the internal object method 'set' is intercepted to perform reactive side effects.
   */
  private proxyHandler(): ProxyHandler<T> {
    const map = this.cbMap;
    return {
      set(target, prop, receiver) {
        if (map.has(prop as string) && JSON.stringify(target[prop as string]) !== JSON.stringify(receiver)) {
          // reflect namespace used for default behaviour
          Reflect.set(target, prop, receiver);

          for (const item of map.get(prop as string)!) {
            item.cb(...item.args);
          }
        }

        return Reflect.set(target, prop, receiver);
      },
    };
  }

  /**
   * Getter to get the original object
   */
  getData() {
    return structuredClone(this.oriObj);
  }

  /**
   * Setter to update the object data
   */
  setData(data: T): null | E {
    let resp = null;

    try {
      for (const key in data) {
        if (!(key in this.proxy)) throw new Error("Argument passed does not match the internal object.");
        this.proxy[key] = data[key];
      }
    } catch (error) {
      resp = error as E;
    }

    return resp;
  }

  /**
   * Watch method to subscribe to an object prop for changes
   */
  subscribe<F extends (...args: Parameters<F>) => ReturnType<F>>(prop: keyof T, handler: CbMapVal<F>) {
    if (this.cbMap.has(prop as string)) {
      const tmpArr = this.cbMap.get(prop as string);
      tmpArr?.push(handler);
      this.cbMap.set(prop as string, tmpArr!);
    } else {
      this.cbMap.set(prop as string, [handler]);
    }
  }

  /**
   * Method to unsubscribe
   */
  unsubscribe(prop: keyof T, handler: (...args: any[]) => any): null | E {
    let resp = null;

    try {
      if (!this.cbMap.has(prop as string)) throw new Error("Prop not found.");

      const handlerArr = this.cbMap.get(prop as string);

      if (!handlerArr) throw new Error("Callback array not found.");

      const handlerIdx = handlerArr.findIndex((h) => h.cb === handler || h.cb.toString() === handler.toString());

      if (handlerIdx < 0) throw new Error("Handler not found.");

      handlerArr.splice(handlerIdx, 1);
    } catch (error) {
      resp = error as E;
    }

    return resp;
  }
}

/**
 * ---------------------------------------- Usage examples ----------------------------------------
 */

const person = {
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
const employee = new Reactive(person);

/**
 * Handlers that will be used to subscribe to a prop in the init object
 */
function printNewLocation(zipcode: string) {
  console.log(`New job location is ${employee.getData().job.location} with zipcode ${zipcode}`);
}

function printNewName() {
  console.log(`New name is ${employee.getData().info.firstname} ${employee.getData().info.lastname}`);
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
employee.setData({ ...employee.getData(), job: { location: "remote" } });
employee.setData({ ...employee.getData(), info: { ...employee.getData().info, firstname: "Jhonny" } });

/**
 * Unsubscribing from the job prop
 * So now even if we update the job property of the object with new data
 * the handler will no be executed.
 */
employee.unsubscribe("job", printNewLocation);

/**
 * After this line you will see that the 'printNewLocation' handler is not invoked
 */
employee.setData({ ...employee.getData(), job: { location: "onsite" } });
