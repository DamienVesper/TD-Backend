import * as Express from 'express';

import Ban from '../models/ban.model';

const router: Express.Router = Express.Router();

router.get(`*`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const isBanned = await Ban.findOne({ IP: req.ip });

    if (isBanned) return;
    next();
});

router.all(`*`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const isBanned = await Ban.findOne({ IP: req.ip });

    if (isBanned) return res.send(`403 Forbidden`).status(403);
    next();
});

export default router;
