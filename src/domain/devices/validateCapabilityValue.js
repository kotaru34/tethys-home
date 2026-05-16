// @ts-nocheck
const semanticValidators = require('./valueDefinitions');

function validateCapabilityValue(resolvedCapability, value) {
  const semanticType = resolvedCapability.semantic_type;
  const constraints = resolvedCapability.constraints || {};

  const validator = semanticValidators[semanticType];
  if (!validator) {
    const error = new Error('UNSUPPORTED_SEMANTIC_TYPE');
    error.details = `No validator for semantic type: ${semanticType}`;
    throw error;
  }
  
  validator(value, constraints, resolvedCapability);
  return;
}

module.exports = validateCapabilityValue;