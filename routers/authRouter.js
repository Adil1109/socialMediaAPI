const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);

router.patch('/change-password', identifier, authController.changePassword);
router.patch(
	'/send-verification-code',
	identifier,
	authController.sendVerificationCode
);

router.patch(
	'/send-forgot-password-code',
	authController.sendForgotPasswordCode
);
router.patch(
	'/verify-forgot-password-code',
	authController.verifyForgotPasswordCode
);

router.patch(
	'/verify-verification-code',
	identifier,
	authController.verifyVerificationCode
);

module.exports = router;
