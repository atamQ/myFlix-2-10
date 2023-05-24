const mongoose = require('mongoose');
const Models = require('./models.js');

const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'); //generates unique identifiers with Node

const Movies = Models.Movie;
const Users = Models.User;

const app = express();
const cors = require('cors');

const { check, validationResult } = require('express-validator');

app.use(cors());
/*let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn't allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));
*/

let auth = require('./auth')(app);
const passport = require('passport');

require('./passport');
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//MAIN PAGE
app.get('/', (req, res) => {
  res.send("Welcome to the main page");
});

//GET LIST OF MOVIES WITH DATA
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//GET MOVIE BY TITLE
app.get('/movies/:title', (req, res) => {
  Movies.findOne({ Title: req.params.title })
    .then((title) => {
      res.json(title);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//GET BY GENRE -- POSTMAN IS CASE SENSITIVE -- Thriller, Drama, Documentary, Biography, Action
app.get('/genres/:name', (req, res) => {
  Genres.findOne({ Name: req.params.name })
    .then((name) => {
      res.json(name);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error: ' + err);
    });
});

//GET BY DIRECTOR NAME
app.get('/directors/:name', (req, res) => {
  Directors.findOne({ Name: req.params.name })
    .then((name) => {
      res.json(name);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error: ' + err);
    });
});

//GET ALL USERS
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error: ' + err);
    })
})

//GET A USER BY USERNAME
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//UPDATE A USERS INFO
/* JSON FORMAT EXPECTED
{
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}
*/
app.put('/users/:Username', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  }, { new: true }, //MAKES SURE UPDATED DOC IS RETURNED
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser)
      }
    });
})

//ADD/REGISTER A USER
app.post('/users',
  //VALIDATOR
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email is not valid').isEmail()
  ], (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: req.body.Password,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });


//UPDATE A USERS INFO
app.put('/users/:Username', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
    { new: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

//ADD A FAVORITE MOVIE TO USERS FAVORITES
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavoriteMovies: req.params.MovieID }
  },
    { new: true }, //MAKES SURE UPDATED DOCUMENT IS RETURNED
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

//DELETE A USER BY USERNAME
app.delete('/users/:Username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});

//app.listen(8080, () => {
 // console.log('App listening on port 8080.');
//});




