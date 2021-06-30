import Express from 'express';

import config from '../../config/config';
import passport from '../passport';

import crypto from 'crypto';

import xssFilters from 'xss-filters';
import * as HCaptcha from 'hcaptcha';

import { UserDoc } from '../types/models';

import log from '../utils/log';

// Nodemailer.
import transport from '../utils/nodemailer';

const router: Express.Router = Express.Router();

// On signup.
router.post(`/signup`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    // If on production, and Captcha is unsigned, reject.
    if (config.mode === `prod` && !req.body[`h-captcha-response`]) return res.json({ errors: `Please solve the captcha.` });

    const username = (req.query.username as string);
    const email = (req.query.email as string);

    const password = (req.query.password as string);
    const confirmPassword = (req.query.confirmPassword as string);

    const hCaptchaKey = (req.query.hCaptcha as string);

    // If not all fields are filled out, somebody tampered with the form. Directly reject the request.
    if (!username || !email || !password || !confirmPassword || (config.mode === `prod` && !hCaptchaKey)) return res.status(400);

    // Username must contain at least one alphabetical character.
    if (!/[a-zA-Z]/.test(username)) return res.json({ errors: `Your username must contain at least one letter.` });

    // Username must be between 3 and 20 characters.
    if (username.length < 3 || username.length > 20) return res.json({ errors: `Your username must be between 3 and 20 characters.` });

    // Username may not contain spaces.
    if (/[^\w\s]/.test(username) || username.split(` `).length > 1) return res.json({ errors: `Your username cannot contain spaces.` });

    // Username may not be a blacklisted username.
    if (config.blacklistedUsernames.includes(username.toLowerCase())) return res.json({ errors: `That username is blacklisted.` });

    // Email must be an actual email.
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) return res.json({ errors: `Invalid email.` });

    // Password must be parseable.
    if (password !== xssFilters.inHTMLData(password)) return res.json({ errors: `Invalid password.` });

    // Passwords must be the same.
    if (password !== confirmPassword) return res.json({ errors: `Passwords do not match.` });

    // Password must be between 8 and 64 characters.
    if (password.length < 8 || password.length > 64) return res.json({ errors: `Your password must be between 8 and 64 characters.` });

    // HCaptcha verification.
    config.mode === `prod` && HCaptcha.verify(process.env.HCAPTCHA_KEY, hCaptchaKey)
        .then(data => !data && res.json({ errors: `Invalid captcha.` }))
        .catch(() => res.status(500));

    passport.authenticate(`signup`, async (err, user: UserDoc, info) => {
        if (err) throw err;

        user.email = email;

        const creationIP = req.header(`x-forwarded-for`) || req.header(`x-real-ip`) || req.ip;
        user.creationIP = creationIP;
        user.lastIP = creationIP;

        user.verified = config.mode === `dev`;
        user.verifyToken = `n${crypto.randomBytes(32).toString(`hex`)}`;

        user.save(err => {
            if (err) throw err;
            log(`yellow`, `Created account "${user.username}" with email "${user.email}".`);

            const mailOptions = {
                from: `Throwdown.TV <no-reply@throwdown.tv>`,
                to: user.email,

                subject: `Email Verification`,
                text: `Hello ${user.username},\n\nIn accordance with creating your account with us, you must verify your email addresss before you can log in.\nPlease do so via this link: https://${config.domain}/verify/${user.verifyToken}\n\nThank you!`
            };

            transport.sendMail(mailOptions, err => err && user.delete() && res.json({ errors: `We could not send you a verification code.` }));
            res.json({ success: `A verification code has been sent to your email.` });
        });
    })(req, res, next);
});

// On login.
router.post(`/login`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const username = (req.query.username as string);
    const password = (req.query.password as string);
    const hCaptcha = (req.query.hCaptcha as string);

    // If the user is already logged in, then redirect them to the homepage.
    if (req.isAuthenticated()) return res.redirect(`/`);

    // If not all fields are filled out, somebody tampered with the form. Directly reject the request.
    if (!username || !password || !hCaptcha) return res.status(400);

    // Make sure the captcha was solved.
    if (config.mode === `prod` && hCaptcha) return res.json({ errors: `Please solve the captcha.` });

    passport.authenticate(`login`, (err, user, info) => {
        if (err) {
            log(`red`, err);
            return res.json({ errors: err });
        }

        if (!user) return res.json({ errors: `User does not exist.` });
        else if (!user.verified) return res.json({ errors: `Please verify your email.` });

        req.logIn(user, err => {
            if (err) {
                log(`red`, err);
                return res.json({ errors: `There was an error processing your request.` });
            }

            log(`yellow`, `User "${user.username}" succesfully logged in.`);
            return res.json({ success: `You have logged in!` });
        });
    })(req, res, next);
});

// On logout.
router.post(`/logout`, async (req: Express.Request, res: Express.Response) => {
    if (req.isAuthenticated()) {
        log(`yellow`, `User "${(<any>req).user.username}" logged out.`);
        req.logOut();
    }

    res.redirect(`/`);
});

// Check if the user is authenticated.
router.get(`/authenticated`, async (req: Express.request, res: Express.Response) => {
    if (req.isAuthenticated()) {
        return res.json({
            isLoggedIn: true,
            username: (<any>req).user.username,
            email: (<any>req).user.email,
            displayName: (<any>req).user.displayName,
            token: (<any>req).user.token ? (<any>req).user.token : undefined,
            isSuspended: (<any>req).user.isSuspended
        });
    } else {
        return res.json({
            isLoggedIn: false
        });
    }
});
export default router;
