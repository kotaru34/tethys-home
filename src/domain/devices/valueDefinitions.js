// @ts-nocheck
const ValueTypes = require('./valueTypes');

function validationError(details) {
  const error = new Error('INVALID_CAPABILITY_VALUE');
  error.details = details;
  return error;
}

const ValueDefinitions = Object.freeze({
  [ValueTypes.BOOLEAN]: (value) => {
    if (typeof value !== 'boolean') {
      throw validationError('Expected boolean');
    }
    return;
  },

  [ValueTypes.NUMERIC]: (value, constraints) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw validationError('Expected number');
    }
    if (constraints.min != null && value < constraints.min) {
      throw validationError(`Value must be >= ${constraints.min}`);
    }
    if (constraints.max != null && value > constraints.max) {
      throw validationError(`Value must be <= ${constraints.max}`);
    }
    if (constraints.step != null && !(value % Number(constraints.step) === 0)) {
      throw validationError(`Value step must be = ${constraints.step}`);
    }
    return;
  },

  [ValueTypes.DURATION]: (value, constraints) => {
    return valueDefinitions[ValueTypes.NUMERIC](value, constraints);
  },

  [ValueTypes.ENUM]: (value, constraints) => {
    if (typeof value !== 'string') {
      throw validationError('Expected string enum value');
    }
    if (Array.isArray(constraints.range) && !constraints.range.includes(value)) {
      throw validationError(`Value must be one of: ${constraints.range.join(', ')}`);
    }
    return;
  },

  [ValueTypes.STRING]: (value, constraints) => {
    if (typeof value !== 'string') {
      throw validationError('Expected string');
    }
    if (constraints.maxlen != null && value.length > constraints.maxlen) {
      throw validationError(`String too long, max length: ${constraints.maxlen}`);
    }
    return;
  },

  [ValueTypes.COLOR]: (value) => {
    if (typeof value !== 'string' && (typeof value !== 'object' || value === null)) {
      throw validationError('Expected color string or object');
    }
    return;
  },

  [ValueTypes.BITMAP]: (value) => {
    if (!Number.isInteger(value)) {
      throw validationError('Expected integer bitmap');
    }
    return;
  },
});

module.exports = ValueDefinitions;