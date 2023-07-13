const jwt = require('jsonwebtoken');

exports.identifier = (req, res, next) => {
	const token = req.cookies['Authorization'];
	if (!token)
		return res.status(403).json({ message: 'You are not authorized' });

	try {
		const userToken = token.split(' ')[1];
		const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
		req.user = jwtVerified;
		next();
	} catch (err) {
		return res.status(403).json({ error: 'You are not authorized' });
	}
};

exports.credentialsVerified = (req, res, next) => {
	const { verified } = req.user;

	if (!verified) {
		return res.status(400).json({
			message: 'Please, verify your account to perform this action!',
		});
	}
	next();
};
