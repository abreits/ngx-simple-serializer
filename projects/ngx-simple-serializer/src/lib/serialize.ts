import { Type } from '@angular/core';

const serializableClasses = new Map<string, Type<any>>();
const serializedNameMap = new Map<string, string>();
let _class = '_class';

/**
 * Class decorator that registers the class as serializable under the specified name
 */
export function Serializable(serializedName?: string) {
  return (serializedClass: Type<any>): void => {
    serializedName = serializedName ?? serializedClass.name;
    /* istanbul ignore next */
    if (serializedNameMap.has(serializedName)) {
      throw (new Error(`Error in @Serializable() class decorator: '${serializedName}' registered more than once`));
    }
    serializedNameMap.set(serializedClass.name, serializedName);
    serializableClasses.set(serializedName, serializedClass);
  };
}

/**
 * Change the default `_class` reserved property name that identifies a `@Serializable` class to a different name.
 * 
 * For example because the `_class` property is used as a normal property inside a serializable object or class.
 */
export function setSerializedClassIdentifier(name: string) {
  _class = name;
}

/**
 * Returns true when the value can be serialized
 */
export function isSerializable(value: any) {
  return serializedNameMap.has(value.constructor.name) ||
    [Boolean, Number, String, Object, Array, Map, Set, Date, RegExp].indexOf(value.constructor) >= 0;
}

export const SerializeSymbol = Symbol('serialize');
export const DeserializeSymbol = Symbol('deserialize');

/**
 * Interface for a `@Serializable class` to perform custom serialization
 * Must implement the following methods:
 * - `[SerializeSymbol](): any`
 * - `[DeserializeSymbol](serializedValue: any): CustomSerializer` (a class object)
 */
export interface CustomSerializer {
  [SerializeSymbol](): any;
  [DeserializeSymbol](serializedValue: any): CustomSerializer;
}

/**
 * Serialize any value to a JSON string, internally converts Map, Set and Date classes so they can be deserialized correctly.
 * Also serializes `@Serializable` classes
 *
 * @param value value to convert to a JSON string
 * @returns JSON string
 */
export function serialize(value: any): string {
  // we don't want to use the built in toJSON method of the Date class here, so we remove it temporarily
  const dateToJSON = Date.prototype.toJSON;
  // @ts-expect-error deleting non optional operand
  delete Date.prototype.toJSON;
  try {
    return JSON.stringify(value, replacer);
  } finally {
    // restore to original toJSON of the Date method
    Date.prototype.toJSON = dateToJSON;
  }
}

/**
 * Deserialize any value previously serialized with `serialize`.
 * Deserializes Map, Set and Date classes back to their original state.
 * Also deserializes `@Persistable` classes
 *
 * @param value a JSON string created with `serialize`
 * @returns the original value
 */
export function deserialize<T=any>(value: string): T {
  return JSON.parse(value, reviver);
}


// JSON stringify replacer function
function replacer(key: string, value: any): any {
  if (key !== '_value') {
    switch (value?.constructor) {
      case undefined: return value;
      case Boolean: return value;
      case Number: return value;
      case String: return value;
      case Object: return value;
      case Array: return value;
      case Map: return { [_class]: 'Map', _value: [...value] };
      case Set: return { [_class]: 'Set', _value: [...value] };
      case Date: return { [_class]: 'Date', _value: value.getTime() };
      case RegExp: return { [_class]: 'RegExp', _value: { source: value.source, flags: value.flags } };
      default: {
        const className = serializedNameMap.get(value.constructor.name);
        if (!className) {
          throw (new Error(`Error in serialize: class '${value.constructor.name}' not decorated as @Serializable()`));
        }
        if (value[SerializeSymbol]) {
          return { [_class]: className, _value: value[SerializeSymbol]() };
        } else {
          return { [_class]: className, _value: value };
        }
      }
    }
  }
  return value;
}

// JSON parse reviver function
function reviver(key: string, value: any): any {
  if (typeof value === 'object' && value !== null) {
    switch (value[_class]) {
      case 'Map': return new Map(value._value);
      case 'Set': return new Set(value._value);
      case 'Date': return new Date(value._value);
      case 'RegExp': return new RegExp(value._value.source, value._value.flags);
      default:
        if (value[_class]) {
          const persistedClass = serializableClasses.get(value[_class]);
          if (persistedClass) {
            if (persistedClass.prototype[DeserializeSymbol]) {
              return persistedClass.prototype[DeserializeSymbol](value._value);
            } else {
              const objectProperties = Object.getOwnPropertyDescriptors(value._value);
              return Object.create(persistedClass.prototype, objectProperties);
            }
          } else {
            throw (new Error(`Error in deserialize: '${value[_class]}' not decorated as @Serializable()`));
          }
        }
    }
  }
  return value;
}
