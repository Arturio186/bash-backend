const {Router} = require('express');
const {applicationsController} = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get('/:date', authMiddleware, applicationsController.getByDate);
router.delete('/:id', authMiddleware, applicationsController.delete);

router.get('/availableHours/:date', applicationsController.getAvailableHours);  
router.post('/add', applicationsController.add);


module.exports = router;