const fs = require('fs');

const deleteFile = (deletePath) => {
	fs.access(deletePath, fs.constants.F_OK, (err) => {
		if (err) {
			throw new Error('Picture not found');
		} else {
			fs.unlink(deletePath, (err) => {
				if (err) {
					throw new Error('Unable to delete picture');
				}
			});
		}
	});
};

module.exports = deleteFile;
