const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

// @desc Register users
// @route POST /api/users
// @access Public
const registerUser = asyncHandler( async (req, res) => {
    const { name, email, password, phoneNumber, identification, address } = req.body

    if (!name || !email || !password || !phoneNumber || !identification || !address) {
        res.status(400)
        throw new Error('Please add all fields')
    }

    //Check if user already exists
    const userExists = await User.findOne({email})

    if(userExists) {
        res.status(400)
        throw new Error('User already Exists')
    }

    //Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //create user
    const user = await User.create({
        name,
        email,
        phoneNumber,
        identification,
        address,
        password:hashedPassword
    })

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid user data')
    }

})

// @desc Authenticate a user
// @route POST /api/login
// @access Public
const loginUser = asyncHandler( async (req, res) => {
    const {email, password} = req.body

    //Check for user by email
    const user = await User.findOne({email})

    //If found, check for email, hashed on DB and unhashed passwords on form
    if(user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid credentials')
    }

    res.json({message: 'Login user'})
})

// @desc Get user data
// @route GET /api/users/me
// @access Private
const getMe = asyncHandler( async (req, res) => {
    const {_id, name, email} = await User.findById(req.user.id)

    res.status(200).json({
        id: _id,
        name,
        email,
    })
})

//Generate a JWT
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '90d'
    })
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
}