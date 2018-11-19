var express       = require('express');
var router        = express.Router();
var multer        = require('multer');
var upload        = multer({dest: './uploads'});
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');


//var url = 'mongodb://localhost:27017/nodeauth' //points to to database


/* GET users listing. */

// G E T  R E Q U E S T
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register',{title:'Register'});
});

router.get('/login', function(req, res, next) {
  res.render('login', {title:'Login'});
});

// P O S T  R E Q U E S T
// 
router.post('/login',
  passport.authenticate('local',{
    failureRedirect:'/users/login', /* if our login fails go to /login */
    failureFlash: 'Invalid username or password'}), /* Displays on screen */
  
    function(req, res) {
   req.flash('success', 'You are now logged in'); /* Displays on screen */
   res.redirect('/'); /* if our login is a succuss homepage */
});

// In order to support login sessions, 
// Passport will serialize and deserialize user instances to and from the session.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// authenticate requests
passport.use(new LocalStrategy(function(username, password, done){ /*done is a callback */
  User.getUserByUsername(username, function(err, user){ /* Method in model */
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function(err, isMatch){ /*Method in model that compare password typed with password in db */
      if(err) return done(err);  /*return err */
      if(isMatch){
        return done(null, user);  /* returns the user */
      } else {
        return done(null, false, {message:'Invalid Password'}); /* returns an obj with error */
      }
    });
  });
}));

router.post('/register', upload.single('profileimage') ,function(req, res, next) {
  // Items that need to be insertet in db
  var name      = req.body.name;
  var email     = req.body.email;
  var username  = req.body.username;
  var password  = req.body.password;
  var password2 = req.body.password2;

  if(req.file){
  	console.log('Uploading File...');
  	var profileimage = req.file.filename;
  } else {
  	console.log('No File Uploaded...');
  	var profileimage = 'noimage.jpg';
  }

  // FORM VALIDATION
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();
  req.checkBody('username','Username field is required').notEmpty();
  req.checkBody('password','Password field is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  // ERROR HANDLELING
  var errors = req.validationErrors();

  if(errors){
  	res.render('register', {
  		errors: errors
  	});
  } else{
  	var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileimage
    });

    // CREATE NEW USER
    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });
    
    // SUCCESS MESSAGE
    req.flash('success', 'You are now registered and can login');

    // REDIRECT
    res.location('/');
    res.redirect('/');
  }
});

// LOGOUT
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = router;
