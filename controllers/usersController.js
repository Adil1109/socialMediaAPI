const User = require('../models/usersModel');

exports.users = async (req, res) => {
	// This controller has better code and algorithm which is closed sourced
	const { page } = req.query;
	const usersPerPage = 10;

	try {
		let pageNum = 0;

		if (page <= 1) {
			pageNum = 0;
		} else {
			pageNum = page - 1;
		}
		const result = await User.find()
			.sort({ createdAt: -1 })
			.skip(pageNum * usersPerPage)
			.limit(usersPerPage);

		res.status(200).json({ success: true, message: 'users', data: result });
	} catch (error) {
		return res
			.status(400)
			.json({ success: false, message: 'Error while getting the users' });
	}
};

exports.addFollowing = async (req, res, next) => {
	const { userId } = req.user;
	const { followId } = req.params;

	try {
		if (!followId) {
			return res.status(404).json({ message: 'That user seems unavailable!' });
		}

		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser) {
			return res.status(400).json({
				message: 'Create an account and login first!',
			});
		}

		if (existingUser.following.includes(followId)) {
			return res
				.status(400)
				.json({ message: 'You are already following this user!' });
		}

		existingUser.following.push(followId);

		await existingUser.save();

		next();
	} catch (err) {
		console.log(err);
	}
};

exports.addFollower = async (req, res) => {
	const { userId } = req.user;
	const { followId } = req.params;
	try {
		const followingUser = await User.findOne({ _id: followId });

		if (!followingUser) {
			return res.status(404).json({
				message: 'The user you want to follow does not available!',
			});
		}

		if (followingUser.followers.includes(userId)) {
			return res
				.status(400)
				.json({ message: 'You are already following this user!' });
		}

		followingUser.followers.push(userId);

		await followingUser.save();

		res.status(200).json({ success: true, message: 'You followed the user!' });
	} catch (err) {
		console.log(err);
	}
};

exports.removeFollowing = async (req, res) => {
	const { userId } = req.user;
	const { unfollowId } = req.params;

	try {
		if (!unfollowId) {
			return res.status(404).json({ message: 'That user seems unavailable!' });
		}

		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser) {
			return res.status(400).json({
				message: 'Create an account and login first!',
			});
		}

		if (!existingUser.following.includes(unfollowId)) {
			return res
				.status(400)
				.json({ message: 'You were not following this user!' });
		}

		existingUser.following.pull(unfollowId);

		await existingUser.save();

		next();
	} catch (err) {
		console.log(err);
	}
};

exports.removeFollower = async (req, res) => {
	const { userId } = req.user;
	const { unfollowId } = req.params;
	try {
		const followingUser = await User.findOne({ _id: unfollowId });

		if (!followingUser) {
			return res.status(404).json({
				message: 'The user you want to follow does not available!',
			});
		}

		if (!followingUser.followers.includes(userId)) {
			return res
				.status(400)
				.json({ message: 'You were not following this user!' });
		}

		followingUser.followers.pull(userId);

		await followingUser.save();

		res
			.status(200)
			.json({ success: true, message: 'You unfollowed the user!' });
	} catch (err) {
		console.log(err);
	}
};
