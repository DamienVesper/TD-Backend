import * as Express from 'express';

import User from '../models/user.model';

const router: Express.Router = Express.Router();

router.get(`/chat/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) return;
    else return;
});

export default router;
