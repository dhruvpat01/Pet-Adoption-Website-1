const router = require('express').Router();
const User = require('../models/users');
const Pets = require('../models/pets');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const cloudinary = require('cloudinary').v2;
const upload = require('../config/multer');

require('../config/cloudinary');
router.get('', (req, res) => {
	res.render('home');
});

// login route
router.get('/login', (req, res) => {
	res.render('login');
});

router.post('/register', upload.single('image'), async (req, res) => {
	const { name, email, password, password2 } = req.body;

	const loc = await cloudinary.uploader
		.upload(req.file.path, function(error, result) {
			console.log('no error');
		})
		.catch((e) => console.log(e));

	let errors = [];
	if (!name || !email || !password || !password2) {
		errors.push({ msg: 'All fields are compulsory' });
	}
	if (password.length < 6) {
		errors.push({ msg: 'Passwords too short' });
	}
	if (password != password2) {
		errors.push({ msg: 'Passwords do not match' });
	}

	if (errors.length > 0) {
		res.render('register', { errors, name, email, password, password2 });
	} else {
		User.findOne({ email: email })
			.then((user) => {
				if (user) {
					errors.push({ msg: 'Email already exists' });
					res.render('register', { errors, name, email, password, password2 });
				} else {
					const newUser = new User({
						name,
						email,
						password
						// profile_img : loc.url
					});

					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if (err) {
								console.log(err);
							} else {
								newUser.password = hash;
								newUser.profile_image = loc.url;
								console.log(newUser);
								newUser.save();
								res.redirect('/login');
							}
						});
					});
				}
			})
			.catch((e) => console.log(e));
	}
});

// Login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect : '/showPets',
		failureRedirect : '/login'
	})(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});
// register route
router.get('/register', (req, res) => {
	res.render('register');
});

router.get('/users', (req, res) => {
	console.log(req.user);
	res.render('users', {
		user : req.user
	});
});

router.get('/showPets', (req, res) => {
	Pets.find({}, (err, pets) => {
		if (err) {
			console.log(err);
		} else {
			console.log(req.user);
			res.render('showPets', {
				pets : pets,
				user : req.user
			});
		}
	});
});

router.get('/add-pets', (req, res) => {
	res.render('add_pets');
});
router.post('/add-pets', upload.single('pet_image'), async (req, res) => {
	console.log(req.body);
	const { petname, petage, breed, color, phone } = req.body;
	const img_loc = await await cloudinary.uploader
		.upload(req.file.path, function(error, result) {
			console.log('no error');
		})
		.catch((e) => console.log(e));
	var new_pet = new Pets({
		petname   : petname,
		petage    : petage,
		color     : color,
		breed     : breed,
		phone     : phone,
		pet_image : img_loc.url
	});

	new_pet.save(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/showPets');
		}
	});
});

// export the routes
module.exports = router;
