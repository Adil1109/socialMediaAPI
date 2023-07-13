const express = require('express');

const router = express.Router();

const usersController = require('../controllers/usersController');
const {
	identifier,
	credentialsVerified,
} = require('../middlewares/identification');

router.get('/', identifier, usersController.users);
router.patch(
	'/follow/:followId',
	identifier,
	credentialsVerified,
	usersController.addFollowing,
	usersController.addFollower
);
router.patch(
	'/unfollow/:unfollowId',
	identifier,
	credentialsVerified,
	usersController.removeFollowing,
	usersController.removeFollower
);

module.exports = router;
