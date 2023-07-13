const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');

exports.signup = async (req, res) => {
	const { firstName, lastName, birthday, gender, email, password } = req.body;

	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.json({ message: 'Invalid credentials!' });
		}
		const hashedPassword = await doHash(password, 12);

		const newUser = new User({
			firstName,
			lastName,
			birthday,
			gender,
			email,
			password: hashedPassword,
		});
		const result = await newUser.save();

		const token = jwt.sign(
			{
				userId: result._id,
				email: result.email,
				verified: result.verified,
			},
			process.env.TOKEN_SECRET
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})

			.json({
				success: true,
				token,
				message: 'Your account has been created successfully',
				result,
			});
	} catch (err) {
		return console.log(err);
	}
};

exports.signin = async (req, res) => {
	const { email, password } = req.body;
	try {
		const existingUser = await User.findOne({ email }).select('+password');

		if (!existingUser) {
			return res.json({ message: 'Invalid credentials!' });
		}
		const result = await doHashValidation(password, existingUser.password);

		if (!result) {
			return res.json({ message: 'Invalid credentials!' });
		}
		const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
				verified: existingUser.verified,
			},
			process.env.TOKEN_SECRET
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({ success: true, token, message: 'You are logged in!' });
	} catch (err) {
		return console.log(err);
	}
};

exports.signout = (req, res) => {
	res
		.clearCookie('Authorization')
		.status(200)
		.json({ success: true, message: 'Successfully logged out!' });
};

exports.sendVerificationCode = async (req, res) => {
	const { userId, verified } = req.user;

	try {
		if (verified) {
			return res
				.status(400)
				.json({ message: 'You are a verified user already!' });
		}

		const existingUser = await User.findOne({ _id: userId });

		if (!existingUser) {
			return res.status(404).json({
				message: 'Create an account first. Then ask for Verification Code!',
			});
		}

		const codeValue = Math.floor(Math.random() * 1000000).toString();

		let info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: existingUser.email,
			subject: 'Verification code for meetup!',
			html:
				'<font color="gray" face="roboto">Your verification code is:</font><br/><h1 align="center"><font color="red">' +
				codeValue +
				'</font></h1>',
		});

		if (info.accepted[0] === existingUser.email) {
			const hashedCodeValue = hmacProcess(
				codeValue,
				process.env.HMAC_VERIFICATION_CODE_SECRET
			);
			existingUser.verificationCode = hashedCodeValue;
			existingUser.verificationCodeValidation = Date.now();
			await existingUser.save();

			return res
				.status(200)
				.json({
					success: true,
					message: 'A verification code has been sent to your email address!',
				});
		}

		res
			.status(400)
			.json({ message: 'Something went wrong! Please, try again later.' });
	} catch (err) {
		console.log(err);
	}
};

exports.verifyVerificationCode = async (req, res) => {
	const { userId, verified } = req.user;
	const { providedCode } = req.body;
	const codeValue = providedCode.toString();
	try {
		if (verified) {
			return res
				.status(400)
				.json({ message: 'You are a verified user already!' });
		}

		const existingUser = await User.findOne({ _id: userId }).select(
			'+verificationCode +verificationCodeValidation'
		);

		if (!existingUser) {
			return res.status(404).json({
				message: 'Invalid credentials!',
			});
		}

		if (
			!existingUser.verificationCode ||
			!existingUser.verificationCodeValidation
		) {
			return res.status(400).json({
				message: 'Something wrong with the code!',
			});
		}

		if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
			existingUser.verificationCode = undefined;
			existingUser.verificationCodeValidation = undefined;

			await existingUser.save();
			return res.status(400).json({
				message: 'The code has been expired!',
			});
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue !== existingUser.verificationCode) {
			return res.status(400).json({
				message: 'This code is incorrect!',
			});
		}

		if (hashedCodeValue === existingUser.verificationCode) {
			existingUser.verified = true;
			existingUser.verificationCode = undefined;
			existingUser.verificationCodeValidation = undefined;

			await existingUser.save();
			return res
				.status(200)
				.json({ success: true, message: 'Your account has been verified!' });
		}
		res
			.status(400)
			.json({ message: 'Something went wrong! Please, try again later.' });
	} catch (err) {
		console.log(err);
	}
};

exports.changePassword = async (req, res) => {
	const { userId, verified } = req.user;
	const { oldPassword, newPassword } = req.body;

	try {
		if (!verified) {
			return res.status(400).json({ message: 'You are not a verified user!' });
		}

		const existingUser = await User.findOne({ _id: userId }).select(
			'+password'
		);

		if (!existingUser) {
			return res.json({ message: 'Invalid credentials!' });
		}

		const result = await doHashValidation(oldPassword, existingUser.password);

		if (!result) {
			return res.json({ message: 'Invalid credentials!' });
		}

		const hashedPassword = await doHash(newPassword, 12);

		existingUser.password = hashedPassword;

		await existingUser.save();

		res
			.status(200)
			.json({ success: true, message: 'Your password has been updated!' });
	} catch (err) {
		console.log(err);
	}
};

exports.sendForgotPasswordCode = async (req, res) => {
	const { email } = req.body;

	try {
		const existingUser = await User.findOne({ email });

		if (!existingUser) {
			return res.json({ message: 'Invalid credentials!' });
		}

		const codeValue = Math.floor(Math.random() * 1000000).toString();

		let info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: existingUser.email,
			subject: 'Reset code for password!',
			html:
				'<font color="gray" face="roboto">Your password reset code is:</font><br/><h1 align="center"><font color="red">' +
				codeValue +
				'</font></h1>',
		});

		if (info.accepted[0] === existingUser.email) {
			const hashedCodeValue = hmacProcess(
				codeValue,
				process.env.HMAC_FORGOT_PASSWORD_CODE_SECRET
			);
			existingUser.forgotPasswordCode = hashedCodeValue;
			existingUser.forgotPasswordCodeValidation = Date.now();
			await existingUser.save();

			return res
				.status(200)
				.json({
					success: true,
					message: 'A password reset code has been sent to your email address!',
				});
		}

		res
			.status(400)
			.json({ message: 'Something went wrong! Please, try again later.' });
	} catch (err) {
		console.log(err);
	}
};

exports.verifyForgotPasswordCode = async (req, res) => {
	const { email, providedCode, newPassword } = req.body;
	const codeValue = providedCode.toString();

	try {
		const existingUser = await User.findOne({ email }).select(
			'+password +forgotPasswordCode +forgotPasswordCodeValidation'
		);

		if (!existingUser) {
			return res.status(404).json({
				message: 'Invalid credentials!',
			});
		}

		if (
			!existingUser.forgotPasswordCode ||
			!existingUser.forgotPasswordCodeValidation
		) {
			return res.status(400).json({
				message: 'Something wrong with the code!',
			});
		}

		if (
			Date.now() - existingUser.forgotPasswordCodeValidation >
			5 * 60 * 1000
		) {
			existingUser.forgotPasswordCode = undefined;
			existingUser.forgotPasswordCodeValidation = undefined;

			await existingUser.save();
			return res.status(400).json({
				message: 'The code has been expired!',
			});
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_FORGOT_PASSWORD_CODE_SECRET
		);

		if (hashedCodeValue !== existingUser.forgotPasswordCode) {
			return res.status(400).json({
				message: 'This code is incorrect!',
			});
		}

		if (hashedCodeValue === existingUser.forgotPasswordCode) {
			const hashedPassword = await doHash(newPassword, 12);
			existingUser.password = hashedPassword;
			existingUser.forgotPasswordCode = undefined;
			await existingUser.save();

			return res
				.status(200)
				.json({ success: true, message: 'Your password has been updated!' });
		}
		res
			.status(400)
			.json({ message: 'Something went wrong! Please, try again later.' });
	} catch (err) {
		console.log(err);
	}
};
