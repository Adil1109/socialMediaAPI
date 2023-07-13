const express = require('express');

const router = express.Router();

const commentsController = require('../controllers/commentsController');
const {
	identifier,
	credentialsVerified,
} = require('../middlewares/identification');

router.get('/:postId/get-comments', commentsController.getComments);
router.post(
	'/:postId/create-comment',
	identifier,
	credentialsVerified,
	commentsController.createComment
);
router.patch(
	'/update-comment/:_id',
	identifier,
	credentialsVerified,
	commentsController.updateComment
);
router.delete(
	'/delete-comment/:_id',
	identifier,
	credentialsVerified,
	commentsController.deleteComment
);

module.exports = router;
