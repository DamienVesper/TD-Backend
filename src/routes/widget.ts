import * as Express from 'express';

import User from '../models/user.model';

const widgetRouter: Express.Router = Express.Router();

widgetRouter.get(`/chat/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) return;
    else return;
});

export default widgetRouter;
