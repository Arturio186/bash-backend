const {Router} = require('express');

const usersRouter = require('./users');
const applicationsRouter = require('./applications');

const router = Router();

router.use('/user', usersRouter);
router.use('/applications', applicationsRouter);

module.exports = router;