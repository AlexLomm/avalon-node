'use strict';

const fs         = require('fs');
const jwt        = require('jsonwebtoken');
const {rootPath} = require('../utils/path');

const publicKey = fs.readFileSync(`${rootPath}/config/jwt/public.pem`, 'utf8');

module.exports = {
  verify(token) {
    return jwt.verify(token, publicKey, {algorithm: 'RS256'});
  }
};
