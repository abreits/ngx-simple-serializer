# ngx-simple-serializer

For the latest changes and the current version see the [Change log](./CHANGELOG.md).

## example

``` typescript
@Serializable('DemoClass')
class DemoClass {
  property1 = 'value1';
  property2 = 'value2';
  concatProperties() {
    return this.property1 + this.property2;
  }
}

const classInstance = new DemoClass();
classinstance.property2 = '23';

const serializedValue = serialize(classInstance);
// you can now store serializedValue in e.g. localstorage, so it can be retrieved after a page refresh

// to restore the value you just do
const restoredInstance = deserialize(serializedValue);
expect(restoredInstance.concatProperties()).toEqual('value123')
```

## documentation

Simple serialization and deserialization support for Classes in Angular with a minimum of boilerplate code.
Serializable classes need only be decoratied with the `@Serializable()` decorator.

Because of its simplicity it has a number of limitations:
- It can only serialize and deserialize objects that succesfully `JSON.stringify()`, so no circular references are allowed.
- To circumvent class name mangling/minimization problems you can add a serialization name to the decorator: `@Serializable('ClassName')`
- Only works when class property names are not mangled/minimized in the build when you change code (should not be a problem with default settings).
- It correctly serializes and deserializes the javascript `Map`, `Set`, `Date` and `RegExp` types
- It needs a reserved property name to identify @Serializable classes in the serialized JSON. This reserved property name defaults to `_class`. 

It contains the following elements:

- `@Serializable(name?: string)` Decorator that marks a Class as serializable.
- `serialize(value: any): string` Function that serializes a value into a JSON string.
- `deserialize<T = any>(value: string): T` Function that deserializes a serialized value back to its original value.
- `isSerializable(value): boolean` Function that determines if a value is a basic serializable value type or decorated as `@Serializable()`.
- `setSerializedClassIdentifier(id: string)` Change the default `_class` reserved property name that identifies a @Serializable class to a different name (e.g. because the `_class` property is used as a normal property inside a serializable object or class).

By default it serializes and deserializes the following javascript value types:

- `boolean`
- `number`
- `string`
- `Array`
- `Object`
- `Map`
- `Set`
- `Date`
- `RegExp`
- Any `class` decorated as `@Serializable()` that only contains serializable properties and does not contain circular references.
