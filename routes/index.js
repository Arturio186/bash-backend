const {Router} = require('express');

const usersRouter = require('./users');
const opreatorsRouter = require('./opreators');
const applicationsRouter = require('./applications');

const router = Router();

router.use('/user', usersRouter);
router.use('/operators', opreatorsRouter);
router.use('/applications', applicationsRouter);

module.exports = router;