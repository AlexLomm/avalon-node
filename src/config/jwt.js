'use strict';

const fs  = require('fs');
const jwt = require('jsonwebtoken');

const publicKey = fs.readFileSync('./config/jwt/public.pem', 'utf8');

module.exports = {
  verify(token) {
    return jwt.verify(token, publicKey, {algorithm: 'RS256'});
  }
};
