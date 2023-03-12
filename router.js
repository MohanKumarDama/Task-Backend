const express = require('express');
const router = express.Router();
const db = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
router.post('/register', signupValidation, (req, res) => {
  db.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: 'User Already Exists',
          status:409
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } else {
        
            db.query(
              `INSERT INTO users (name, email, password) VALUES ('${req.body.name}', ${db.escape(
                req.body.email
              )}, ${db.escape(hash)})`,
              (err, result) => {
                if (err) {
        
                  return res.status(400).send({
                    msg: err,
                    status:400
                  });
                }
                return res.status(201).send({
                  msg: 'User Registered Successfully...!!',
                  status:201
                });
              }
            );
          }
        });
      }
    }
  );
});
router.post('/login', loginValidation, (req, res) => {
  db.query(
    `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
    (err, result) => {
 
      if (err) {

        return res.status(400).send({
          msg: err
        });
      }
      if (!result.length) {
        return res.status(401).send({
          msg: 'Email or password is incorrect!'
        });
      }
      bcrypt.compare(
        req.body.password,
        result[0]['password'],
        (bErr, bResult) => {
          if (bErr) {
            return res.status(401).send({
              msg: 'Invalid Credentials',
              err: bErr
            });
          }
          if (bResult) {
            const token = jwt.sign({ id: result[0].id }, 'MY_SECRET_KEY', { expiresIn: '1h' });
            db.query(
              `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
            );
            return res.status(200).send({
              msg: 'Logged in successfully...!!',
              token,
              status: 200,
              id: result[0].id,
              name:result[0].name,
              email:result[0].email
            });
          }
          return res.status(401).send({
            msg: 'Username or password is incorrect!'
          });
        }
      );
    }
  );
});
router.get('/get-user', signupValidation, (req, res) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer') ||
    !req.headers.authorization.split(' ')[1]
  ) {
    return res.status(422).json({
      message: "Token Not Found..",
    });
  }
  const theToken = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(theToken, 'MY_SECRET_KEY');
  db.query('SELECT id,name,email FROM users where id=?', decoded.id, function (error, results) {
    if (error) throw error;
    return res.send({ error: false, status:200 ,data: results[0], message: 'Fetched User Details Successfully' });
  });
});
module.exports = router;