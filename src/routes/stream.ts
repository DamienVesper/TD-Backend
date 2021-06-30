import Express from 'express';

import config from '../../config/config';
import passport from '../passport';

import crypto from 'crypto';

import xssFilters from 'xss-filters';
import * as HCaptcha from 'hcaptcha';

import User from '../models/user.model';

import log from '../utils/log';

// Nodemailer.
import transport from '../utils/nodemailer';

const router: Express.Router = Express.Router();

router.get(`/data`, async (req: Express.Request, res: Express.Response) => {
    const username = (req.query.username as string);
    const user = await User.findOne({ username });

    if (!user) return res.status(404);

    return res.json({
        username,
        displayName: user.displayName,
        streamTitle: user.settings.title,
        streamDescription: user.settings.description,
        donationLink: user.settings.donationLink,
        isSuspended: user.isSuspended,
        viewers: user.viewers,
        followers: user.followers,
        avatarURL: user.avatarURL,
        isVip: user.perms.vip,
        isStaff: user.perms.staff,
        isLive: user.live,
        rtmpServer: user.settings.rtmpServer
    });
});

export default router;
