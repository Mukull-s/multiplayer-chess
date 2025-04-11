const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Register new user
const registerUser = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        console.log('Registration attempt:', { email, username });

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user with trimmed password
        const user = new User({
            email,
            password: password.trim(), // Trim whitespace from password
            username,
            profile: {
                avatar: 'default-avatar.png',
            },
            stats: {
                rating: 1200,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
            },
        });

        await user.save();
        console.log('User created successfully');

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                stats: user.stats,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email });
        console.log('Password length:', password.length);

        // Find user
        const user = await User.findOne({ email });
        console.log('User found:', user ? 'yes' : 'no');
        console.log('User details:', user ? { id: user._id, email: user.email } : null);
        
        if (!user) {
            console.log('User not found in database');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        console.log('Comparing passwords...');
        console.log('Stored password hash length:', user.password.length);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        console.log('Login successful, token generated');
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                stats: user.stats,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { bio, country, preferences } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (bio) user.profile.bio = bio;
        if (country) user.profile.country = country;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            profile: user.profile,
            preferences: user.preferences,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user avatar
const updateUserAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.profile.avatar = avatar;
        await user.save();

        res.json({
            message: 'Avatar updated successfully',
            avatar: user.profile.avatar,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('stats username profile');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            username: user.username,
            avatar: user.profile.avatar,
            stats: user.stats,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user's active games
const getUserActiveGames = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'gameHistory',
                match: { status: 'in-progress' },
                select: 'gameId opponent result timestamp',
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.gameHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user's completed games
const getUserCompletedGames = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'gameHistory',
                match: { status: { $in: ['checkmate', 'resigned', 'draw', 'timeout'] } },
                select: 'gameId opponent result timestamp',
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.gameHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user's online status
const updateUserStatus = async (req, res) => {
    try {
        const { socketId, isOnline } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.socketId = socketId;
        user.isOnline = isOnline;
        user.lastSeen = new Date();

        await user.save();

        res.json({
            message: 'Status updated successfully',
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get online users
const getOnlineUsers = async (req, res) => {
    try {
        const users = await User.find({ isOnline: true })
            .select('username profile.avatar stats.rating socketId');

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Search users
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ],
        })
            .select('username profile.avatar stats.rating isOnline')
            .limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    getUserStats,
    getUserActiveGames,
    getUserCompletedGames,
    updateUserStatus,
    getOnlineUsers,
    searchUsers,
}; 