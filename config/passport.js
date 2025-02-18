const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModel');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://grabify.site:3000/user/auth/google/callback' // Ensure this matches the URI in Google Developer Console
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.username = profile.displayName;
          await user.save();
        } else {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value
          });
          await user.save();
        }
      }

      // Check if user is blocked
      if (user.isBlock) {
        return done(null, false, { message: 'Your account has been blocked. Please contact support.' });
      }

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});
