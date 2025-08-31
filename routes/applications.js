const {Router} = require('express');
const {applicationsController} = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get('/availableHours/:date', applicationsController.getAvailableHours); 
router.get('/randomOperator', applicationsController.getRandomOperator); 
router.post('/add', applicationsController.add);

router.get('/:date', authMiddleware, applicationsController.getByDate);
router.delete('/:id', authMiddleware, applicationsController.delete);


module.exports = router;