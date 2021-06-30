import bcrypt from 'bcrypt';

import User from './models/user.model';

import log from './utils/log';
import randomString from './utils/randomString';

import passport from 'passport';
import passportLocal from 'passport-local';

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

export default passport;
