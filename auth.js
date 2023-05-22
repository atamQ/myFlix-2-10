const jwtSecret = 'your_jwt_secret'; //same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport'); //local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, //this is username encoded in the JWT
    expiresIn: '7d',
    algorithm: 'HS256' //algorithm used to encode the values of the jwt
  });
}

/*POST login*/
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false },
      (error, user, info) => {
        if (error || !user) {
          return res.status(400).json({
            message: 'Something went wrong.',
            user: user
          });
        }
        req.login(user, { session: false }, (error) => {
          if (error) {
            res.send(error);
          }
          let token = generateJWTToken(user.toJSON());
          return res.json({ user, token });//this is ES6 shorthand
          //for res.json({user: user, token: token})...with ES6 if your
          //keys are the same as your values, you can use this shorthand
        });
      })(req, res);

  })
}
