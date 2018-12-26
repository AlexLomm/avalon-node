'use strict';

const fs        = require('fs');
const jwt       = require('jsonwebtoken');
const {rootDir} = require('../utils/path');

const publicKey = fs.readFileSync(`${rootDir}/config/jwt/public.pem`, 'utf8');

module.exports = {
  verify(token) {
    return jwt.verify(token, publicKey, {algorithm: 'RS256'});
  }
};
