const Post = require('../models/postsModel');
const User = require('../models/usersModel');
const deleteFile = require('../utils/deleteFile');

exports.posts = async (req, res) => {
	// This controller has better code and algorithm which is closed sourced
	const { page } = req.query;
	const postsPerPage = 10;

	try {
		let pageNum = 0;

		if (page <= 1) {
			pageNum = 0;
		} else {
			pageNum = page - 1;
		}
		const result = await Post.find()
			.sort({ createdAt: -1 })
			.skip(pageNum * postsPerPage)
			.limit(postsPerPage);

		res.status(200).json({ success: true, message: 'posts', data: result });
	} catch (error) {
		return res
			.status(400)
			.json({ success: false, message: 'Error while getting the posts' });
	}
};

exports.createPost = async (req, res, next) => {
	const givenPicture = req.file;
	const { postBody } = req.body;
	const { userId } = req.user;
	const CREATE_POST_URL = '/create-post';
	const CREATE_PROFILE_PICTURE_POST_URL = '/create-profile-picture-post';
	const CREATE_COVER_PICTURE_POST_URL = '/create-cover-picture-post';

	try {
		if (!givenPicture) {
			if (
				req.url === CREATE_PROFILE_PICTURE_POST_URL ||
				req.url === CREATE_COVER_PICTURE_POST_URL
			) {
				return res.status(422).json({ message: 'Picture is required!' });
			}
			if (
				!postBody ||
				postBody.trim() === '' ||
				postBody === undefined ||
				postBody === null
			) {
				return res
					.status(400)
					.json({ message: 'Write something or select a picture to post!' });
			}
		}

		const pictureUrl = givenPicture ? givenPicture.path : undefined;

		let pictureType;

		if (givenPicture) {
			if (req.url === CREATE_POST_URL) {
				pictureType = 'post-picture';
			} else if (req.url === CREATE_PROFILE_PICTURE_POST_URL) {
				pictureType = 'profile-picture';
			} else if (req.url === CREATE_COVER_PICTURE_POST_URL) {
				pictureType = 'cover-picture';
			}
		}

		await Post.create({
			postBody,
			postPicture: pictureUrl,
			pictureType,
			userId,
		});

		if (req.url === CREATE_POST_URL) {
			return res
				.status(200)
				.json({ success: true, message: 'Your post was successful!' });
		}
		if (
			req.url === CREATE_PROFILE_PICTURE_POST_URL ||
			req.url === CREATE_COVER_PICTURE_POST_URL
		) {
			next();
		}
	} catch (err) {
		console.log(err);
	}
};

exports.attachingProfileOrCoverPicture = async (req, res) => {
	const { userId } = req.user;
	const givenPicture = req.file;
	const CREATE_PROFILE_PICTURE_POST_URL = '/create-profile-picture-post';
	const CREATE_COVER_PICTURE_POST_URL = '/create-cover-picture-post';
	try {
		const pictureUrl = givenPicture.path;
		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser || !existingUser.verified) {
			return res
				.status(404)
				.json({ message: 'You cannot post at this moment!' });
		}

		let dynamicMessage;
		if (req.url === CREATE_PROFILE_PICTURE_POST_URL) {
			existingUser.profilePicture = pictureUrl;
			dynamicMessage = 'Profile';
		}

		if (req.url === CREATE_COVER_PICTURE_POST_URL) {
			existingUser.coverPicture = pictureUrl;
			dynamicMessage = 'Cover';
		}

		const result = await existingUser.save();

		return res.status(203).json({
			success: true,
			message: `${dynamicMessage} picture uploaded succesfully!`,
			result,
		});
	} catch (err) {
		console.log(err);
	}
};

////////////////////////////////////////

exports.updatePost = async (req, res, next) => {
	const { _id } = req.params;
	const givenPicture = req.file;
	const { postBody } = req.body;
	const { userId } = req.user;
	const UPDATE_POST_URL = '/update-post';
	const UPDATE_PROFILE_PICTURE_POST_URL = '/update-profile-picture-post';
	const UPDATE_COVER_PICTURE_POST_URL = '/update-cover-picture-post';

	try {
		if (!_id) {
			return res.status(404).json({ message: 'That post seems unavailable!' });
		}

		if (!givenPicture) {
			if (
				req.url.startsWith(UPDATE_PROFILE_PICTURE_POST_URL) ||
				req.url.startsWith(UPDATE_COVER_PICTURE_POST_URL)
			) {
				return res.status(422).json({ message: 'Picture is required!' });
			}
			if (
				!postBody ||
				postBody.trim() === '' ||
				postBody === undefined ||
				postBody === null
			) {
				return res
					.status(400)
					.json({ message: 'Atleast provide some text to update the post!' });
			}
		}

		const pictureUrl = givenPicture ? givenPicture.path : undefined;

		const existingPost = await Post.findOne({ _id });

		if (!existingPost) {
			deleteFile(pictureUrl);
			return res
				.status(404)
				.json({ message: 'Oops! That post seems unavailable!' });
		}

		if (existingPost.userId.toString() !== userId) {
			deleteFile(pictureUrl);

			return res.status(400).json({
				message: 'You do not have the authority to update this post!',
			});
		}

		if (existingPost.postPicture) {
			deleteFile(existingPost.postPicture);
			req.oldPictureUrl = existingPost.postPicture;
		}

		existingPost.postBody = postBody;
		existingPost.postPicture = pictureUrl;
		const result = await existingPost.save();

		if (req.url.startsWith(UPDATE_POST_URL)) {
			return res.status(200).json({
				success: true,
				message: 'Your post was successfully updated!',
				result,
			});
		}

		if (
			req.url.startsWith(UPDATE_PROFILE_PICTURE_POST_URL) ||
			req.url.startsWith(UPDATE_COVER_PICTURE_POST_URL)
		) {
			next();
		}
	} catch (err) {
		console.log(err);
	}
};

exports.reattachingProfileOrCoverPicture = async (req, res) => {
	const { userId } = req.user;
	const givenPicture = req.file;
	const UPDATE_PROFILE_PICTURE_POST_URL = '/update-profile-picture-post';
	const UPDATE_COVER_PICTURE_POST_URL = '/update-cover-picture-post';

	try {
		const pictureUrl = givenPicture.path;
		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser || !existingUser.verified) {
			deleteFile(pictureUrl);
			return res
				.status(404)
				.json({ message: 'You cannot update post at this moment!' });
		}

		let dynamicMessage;
		if (req.url.startsWith(UPDATE_PROFILE_PICTURE_POST_URL)) {
			if (existingUser.profilePicture === req.oldPictureUrl) {
				existingUser.profilePicture = pictureUrl;
			}
			dynamicMessage = 'Profile';
		}

		if (req.url.startsWith(UPDATE_COVER_PICTURE_POST_URL)) {
			if (existingUser.coverPicture === req.oldPictureUrl) {
				existingUser.coverPicture = pictureUrl;
			}
			dynamicMessage = 'Cover';
		}

		const result = await existingUser.save();
		return res.status(200).json({
			success: true,
			message: `${dynamicMessage} picture post updated succesfully!`,
			result,
		});
	} catch (err) {
		console.log(err);
	}
};

///////////////////////////////

exports.deletePost = async (req, res, next) => {
	const { _id } = req.params;
	const { userId } = req.user;

	try {
		if (!_id) {
			return res.status(404).json({ message: 'That post seems unavailable!' });
		}

		const existingPost = await Post.findOne({ _id });

		if (!existingPost) {
			return res
				.status(404)
				.json({ message: 'Oops! That post seems already unavailable!' });
		}

		if (existingPost.userId.toString() !== userId) {
			return res.status(400).json({
				message: 'You do not have the authority to delete this post!',
			});
		}

		let isProfileOrCover;

		if (existingPost.postPicture) {
			isProfileOrCover =
				existingPost.pictureType === 'profile-picture' ||
				existingPost.pictureType === 'cover-picture';
			if (isProfileOrCover) {
				req.pictureType = existingPost.pictureType;
				req.pictureToDelete = {
					pictureType: existingPost.pictureType,
					picturePath: existingPost.postPicture,
				};
			}

			deleteFile(existingPost.postPicture);
		}

		await Post.deleteOne({ _id });
		if (!isProfileOrCover) {
			return res
				.status(203)
				.json({ success: true, message: 'Post deleted succesfully!' });
		}
		next();
	} catch (err) {
		console.log(err);
	}
};

exports.detachingProfileOrCoverPicture = async (req, res) => {
	const { userId } = req.user;
	const { pictureType, picturePath } = req.pictureToDelete;

	try {
		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser || !existingUser.verified) {
			return res
				.status(404)
				.json({ message: 'You cannot post at this moment!' });
		}
		const dynamicMessage =
			pictureType === 'profile-picture' ? 'Profile' : 'Cover';

		if (pictureType === 'profile-picture') {
			if (existingUser.profilePicture === picturePath) {
				existingUser.profilePicture = 'no-profile-photo';
			}
		}

		if (pictureType === 'cover-picture') {
			if (existingUser.coverPicture === picturePath) {
				existingUser.coverPicture = 'no-cover-photo';
			}
		}

		await existingUser.save();
		return res.status(203).json({
			success: true,
			message: `${dynamicMessage} picture has been deleted!`,
		});
	} catch (err) {
		console.log(err);
	}
};

/////////////////////////////////////////////////

exports.likePost = async (req, res) => {
	const { _id } = req.params;
	const { userId } = req.user;

	try {
		if (!_id) {
			return res.status(404).json({ message: 'That post seems unavailable!' });
		}

		const existingPost = await Post.findOne({ _id });

		if (!existingPost) {
			return res
				.status(404)
				.json({ message: 'Oops! That post seems already unavailable!' });
		}

		if (existingPost.likes.includes(userId)) {
			return res.status(400).json({ message: 'You cannot like a post twice!' });
		}

		existingPost.likes.push(userId);

		const result = await existingPost.save();

		res.status(200).json({ success: true, message: result.likes.length });
	} catch (err) {
		console.log(err);
	}
};

exports.unlikePost = async (req, res) => {
	const { _id } = req.params;
	const { userId } = req.user;

	try {
		if (!_id) {
			return res.status(404).json({ message: 'That post seems unavailable!' });
		}

		const existingPost = await Post.findOne({ _id });

		if (!existingPost) {
			return res
				.status(404)
				.json({ message: 'Oops! That post seems already unavailable!' });
		}

		if (!existingPost.likes.includes(userId)) {
			return res
				.status(400)
				.json({ message: 'You did not liked this post already!' });
		}

		existingPost.likes.pull(userId);

		const result = await existingPost.save();

		res.status(200).json({ success: true, message: result.likes.length });
	} catch (err) {
		console.log(err);
	}
};
