const Comment = require('../models/commentsModel');

exports.getComments = async (req, res) => {
	// This controller has better code and algorithm which is closed sourced
	const {postId} = req.params;
	const {  page } = req.query;
	const commentsPerPage = 10;

	try {
		let pageNum = 0;

		if (page <= 1) {
			pageNum = 0;
		} else {
			pageNum = page - 1;
		}
		const result = await Comment.find({ postId })
			.sort({ createdAt: -1 })
			.skip(pageNum * commentsPerPage)
			.limit(commentsPerPage);

		res.status(200).json({ success: true, message: 'comments', data: result });
	} catch (error) {
		return res
			.status(400)
			.json({ success: false, message: 'Error while getting the comments' });
	}
};

exports.createComment = async (req, res) => {
	const { postId } = req.params;
	const { commentBody } = req.body;
	const { userId } = req.user;

	try {
		if (!postId) {
			return res
				.status(404)
				.json({ message: "It seems the post doesn't exist!" });
		}

		const result = await Comment.create({
			commentBody,
			postId,
			userId,
		});

		res.status(201).json({ success: true, message: 'Comment posted!', result });
	} catch (err) {
		console.log(err);
	}
};

exports.updateComment = async (req, res) => {
	const { _id } = req.params;
	const { commentBody } = req.body;
	const { userId } = req.user;

	try {
		if (!_id) {
			return res
				.status(404)
				.json({ message: 'That comment seems unavailable!' });
		}

		const existingComment = await Comment.findOne({ _id });

		if (!existingComment) {
			return res
				.status(404)
				.json({ message: 'Oops! That comment seems unavailable!' });
		}

		if (existingComment.userId.toString() !== userId) {
			return res.status(400).json({
				message: 'You do not have the authority to update this comment!',
			});
		}

		existingComment.commentBody = commentBody;
		const result = await existingComment.save();
		res
			.status(203)
			.json({ success: true, message: 'Comment updated succesfully!', result });
	} catch (err) {
		console.log(err);
	}
};

exports.deleteComment = async (req, res) => {
	const { _id } = req.params;
	const { userId } = req.user;

	try {
		if (!_id) {
			return res
				.status(404)
				.json({ message: 'That comment seems unavailable!' });
		}

		const existingComment = await Comment.findOne({ _id });

		if (!existingComment) {
			return res
				.status(404)
				.json({ message: 'Oops! That comment seems already unavailable!' });
		}

		if (existingComment.userId.toString() !== userId) {
			return res.status(400).json({
				message: 'You do not have the authority to delete this comment!',
			});
		}

		await Comment.deleteOne({ _id });
		res
			.status(203)
			.json({ success: true, message: 'Comment deleted succesfully!' });
	} catch (err) {
		console.log(err);
	}
};
