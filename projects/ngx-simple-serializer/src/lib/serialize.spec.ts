// import { LocalPersist } from './persist';
import { serialize, deserialize, Serializable, CustomSerializer, SerializeSymbol, DeserializeSymbol, isSerializable, setSerializeId } from './serialize';

// *************************************************************************************
// ** Testing if the serialization works
// *************************************************************************************

@Serializable('TestClass1')
class TestSerializeNamedClass1 {
  property1 = '123';
}

@Serializable()
class TestSerializeClass1 {
  property0 = null;
  property1 = true;
  property2 = 12345;
  property3 = '123';
  property4 = { a: 0 };
  property5 = [0, '1'];
  property6 = new Map([['key1', 'val1'], ['key2', 'val2']]);
  property7 = new Set(['val1', 'val2', 'val3']);
  property8 = new Date();
  property9 = /lorem-ipsum/gi;

  getProperty1() {
    return this.property1;
  }
}

@Serializable()
class TestSerializeClass1b {
  property0 = undefined; // special test case
}

@Serializable()
class TestSerializeClass2 {
  property1 = '123';
  property2 = new TestSerializeClass1();
  property3 = 12345;

  getProperty2() {
    return this.property2;
  }
}

@Serializable()
class TestSerializeClass3 implements CustomSerializer {
  property1 = 'justatest';
  property2 = 54321;

  [SerializeSymbol](): any {
    return {
      p1: this.property1,
      p2: this.property2
    };
  }

  [DeserializeSymbol](value: any): TestSerializeClass3 {
    const result = new TestSerializeClass3();
    result.property1 = value.p1;
    result.property2 = value.p2;
    return result;
  }
}

class TestUnserializableClass4 {
  property1 = '123';
  property2 = true;
  property3 = 12345;
  property4 = new Date();
  property5 = /lorem-ipsum/gi;

  getProperty1() {
    return this.property1;
  }
}

describe('serialize and deserialize', () => {
  it('should serialize and deserialize @Serializable() class TestSerializeClass1', () => {
    const testValue = new TestSerializeClass1();
    const serializedValue = serialize(testValue);

    expect(deserialize(serializedValue)).toEqual(testValue);
  });

  it('should serialize and deserialize @Serializable() class TestSerializeClass0 (special case for undefined)', () => {
    const testValue = new TestSerializeClass1b();
    const serializedValue = serialize(testValue);

    expect(deserialize(serializedValue).property0).toEqual(testValue.property0);
  });

  it('should serialize a deserialize @Serializable(`TestClass1`) class TestSerializeNamedClass1', () => {
    const testValue = new TestSerializeNamedClass1();
    const serializedValue = serialize(testValue);

    const content = JSON.parse(serializedValue);
    expect(content._class).toEqual('TestClass1');

    expect(deserialize(serializedValue)).toEqual(testValue);
  });

  it('should serialize and deserialize embedded @Serializable() classes', () => {
    const testValue = new TestSerializeClass2();
    const serializedValue = serialize(testValue);

    expect(deserialize(serializedValue)).toEqual(testValue);
  });

  it('should serialize and deserialize classes with @Serializable decorator that implement CustomSerializer', () => {
    const testValue = new TestSerializeClass3();
    const serializedValue = serialize(testValue);

    expect(deserialize(serializedValue)).toEqual(testValue);
  });

  it('should return an error calling deserialize() if the stringified class doen not exist', () => {
    const testValue = new TestSerializeClass1();
    let serializedValue = serialize(testValue);

    // change the classname
    serializedValue = serializedValue.split('TestSerializeClass1').join('NonExistingTestSerializeClass');

    // test
    expect(() => deserialize(serializedValue)).toThrowError('Error in deserialize: \'NonExistingTestSerializeClass\' not decorated as @Serializable()');
  });

  it('should return an error calling serialize() if the class is not decorated with @Serializable', () => {
    const testValue = new TestUnserializableClass4();

    expect(() => serialize(testValue)).toThrowError('Error in serialize: class \'TestUnserializableClass4\' not decorated as @Serializable()');
  });
});

describe('isSerializable', () => {
  it('should return true if the object is serializable', () => {
    // custom class
    const testValue = new TestSerializeClass1();
    expect(isSerializable(testValue)).toBe(true);

    // base value
    const testValue2 = 123;
    expect(isSerializable(testValue2)).toBe(true);
  });

  it('should return false if the object is not serializable', () => {
    const testValue = new TestUnserializableClass4();
    expect(isSerializable(testValue)).toBe(false);
  });
});

describe('setSerializeId', () => {
  it('should serialize and deserialize using a custom id', () => {
    const customId = '__custom_id__';
    setSerializeId(customId);

    const testValue = new TestSerializeClass1();
    const serializedValue = serialize(testValue);

    expect(serializedValue.indexOf('"__custom_id__":"TestSerializeClass1"')>=0).toBeTrue();

    expect(deserialize(serializedValue)).toEqual(testValue);

    // change back to default so othert tests keep working
    setSerializeId('_class');
  });
});
