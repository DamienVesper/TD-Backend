import bcrypt from 'bcrypt';

import User from './models/user.model';
import { UserDoc } from './types/models';

import log from './utils/log';
import randomString from './utils/randomString';

import passport from 'passport';
import PassportLocal from 'passport-local';

passport.serializeUser((user: UserDoc, done): void => {
    done(null, user);
});

passport.deserializeUser((id, done): void => {
    User.findById(id, (err: any, user: UserDoc): void => {
        done(err, user);
    });
});

// Login strategy.
passport.use(`login`, new PassportLocal.Strategy({
    usernameField: `login-username`,
    passwordField: `login-password`
}, (username, password, done) => {
    User.findOne({
        username: username.toLowerCase()
    }).then(user => {
        if (!user) return done(`Incorrect username or password`, false);

        // Login a user.
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return log(`red`, err.stack);
            else if (isMatch) {
                user.token = randomString(32);
                user.save();

                return done(null, user);
            } else return done(`Incorrect username / password`, false);
        });
    }).catch(err => done(err, false));
}));

// Registration.
passport.use(`signup`, new PassportLocal.Strategy({
    usernameField: `signup-username`,
    passwordField: `signup-password`
}, (username, password, done) => {
    User.findOne({
        username
    }).then(user => {
        if (user) return done(`User already exists`, false);

        const signupUser = new User({
            username: username.toLowerCase(),
            displayName: username,
            creationDate: new Date(),
            settings: {
                streamKey: randomString(64)
            },
            password
        });

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return done(err);
            bcrypt.hash(signupUser.password, salt, (err, hash) => {
                if (err) return done(err);

                signupUser.password = hash;
                signupUser.save(err => {
                    if (err) return done(err);
                    return done(null, signupUser);
                });
            });
        });
    });
}));

export default passport;
