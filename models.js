const mongoose = require('mongoose'),
  bcryptjs = require('bcryptjs');

let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
  },
  ImagePath: String,
  Featured: Boolean,
  Vehicles: [String],
});

let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  Birthday: Date,
});

userSchema.statics.hashPassword = (password) => {
  return bcryptjs.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcryptjs.compareSync(password, this.Password);
}

let genreSchema = mongoose.Schema({
  Name: String,
  Description: String,
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Genre = mongoose.model('Genre', genreSchema);


module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Genre = Genre;