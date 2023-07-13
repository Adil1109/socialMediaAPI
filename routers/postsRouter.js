const express = require('express');

const router = express.Router();

const postsController = require('../controllers/postsController');
const {
	identifier,
	credentialsVerified,
} = require('../middlewares/identification');
const uploader = require('../middlewares/uploader');

router.get('/', postsController.posts);

//

router.post(
	'/create-post',
	identifier,
	credentialsVerified,
	uploader.single('post-picture'),
	postsController.createPost
);

router.post(
	'/create-profile-picture-post',
	identifier,
	credentialsVerified,
	uploader.single('profile-picture'),
	postsController.createPost,
	postsController.attachingProfileOrCoverPicture
);

router.post(
	'/create-cover-picture-post',
	identifier,
	credentialsVerified,
	uploader.single('cover-picture'),
	postsController.createPost,
	postsController.attachingProfileOrCoverPicture
);

//

router.patch(
	'/update-post/:_id',
	identifier,
	credentialsVerified,
	uploader.single('post-picture'),
	postsController.updatePost,
	postsController.reattachingProfileOrCoverPicture
);
router.patch(
	'/update-profile-picture-post/:_id',
	identifier,
	credentialsVerified,
	uploader.single('profile-picture'),
	postsController.updatePost,
	postsController.reattachingProfileOrCoverPicture
);
router.patch(
	'/update-cover-picture-post/:_id',
	identifier,
	credentialsVerified,
	uploader.single('cover-picture'),
	postsController.updatePost,
	postsController.reattachingProfileOrCoverPicture
);

//

router.delete(
	'/delete-post/:_id',
	identifier,
	credentialsVerified,
	postsController.deletePost,
	postsController.detachingProfileOrCoverPicture
);

//

router.patch(
	'/like-post/:_id',
	identifier,
	credentialsVerified,
	postsController.likePost
);
router.patch(
	'/unlike-post/:_id',
	identifier,
	credentialsVerified,
	postsController.unlikePost
);

module.exports = router;
