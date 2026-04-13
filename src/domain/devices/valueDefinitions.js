const ValueTypes = require('./valueTypes');

const ValueDefinitions = Object.freeze({
  [ValueTypes.BOOLEAN]: {
    jsKind: 'boolean',
    accepts: ['boolean'],
  },

  [ValueTypes.NUMERIC]: {
    jsKind: 'number',
    accepts: ['number'],
  },

  [ValueTypes.DURATION]: {
    jsKind: 'number',
    accepts: ['number'],
    semanticUnit: 'duration',
  },

  [ValueTypes.ENUM]: {
    jsKind: 'string',
    accepts: ['string'],
  },

  [ValueTypes.STRING]: {
    jsKind: 'string',
    accepts: ['string'],
  },

  [ValueTypes.COLOR]: {
    jsKind: 'object',
    accepts: ['object', 'string'],
  },

  [ValueTypes.BITMAP]: {
    jsKind: 'number',
    accepts: ['number'],
  },
});

module.exports = ValueDefinitions;