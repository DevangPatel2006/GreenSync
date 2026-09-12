const express = require('express');
const auth = require('../middleware/auth');
const { validateDeviceCreate, validateDeviceUpdate } = require('../middleware/validate');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

// Protect all device routes with JWT authentication
router.use(auth);

router.get('/', deviceController.getDevices);
router.post('/', validateDeviceCreate, deviceController.createDevice);
router.put('/:id', validateDeviceUpdate, deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
