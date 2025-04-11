const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Authentication
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
    },

    // Profile Information
    profile: {
        avatar: {
            type: String,
            default: 'default-avatar.png',
        },
        bio: {
            type: String,
            default: '',
        },
        country: {
            type: String,
            default: '',
        },
    },

    // Game Statistics
    stats: {
        rating: {
            type: Number,
            default: 1200,
        },
        gamesPlayed: {
            type: Number,
            default: 0,
        },
        wins: {
            type: Number,
            default: 0,
        },
        losses: {
            type: Number,
            default: 0,
        },
        draws: {
            type: Number,
            default: 0,
        },
        timePlayed: {
            type: Number, // in minutes
            default: 0,
        },
    },

    // Connection Information
    socketId: {
        type: String,
        default: null,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },

    // Game Preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
        pieceSet: {
            type: String,
            default: 'default',
        },
        boardColor: {
            type: String,
            default: 'default',
        },
        timeControl: {
            type: String,
            enum: ['blitz', 'rapid', 'classical'],
            default: 'rapid',
        },
    },

    // Security
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },

    // Social
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    friendRequests: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],

    // Game History
    gameHistory: [{
        gameId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game',
        },
        result: {
            type: String,
            enum: ['win', 'loss', 'draw'],
        },
        opponent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes for better query performance
userSchema.index({ 'stats.rating': -1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        console.log('Hashing password for user:', this.email);
        console.log('Original password length:', this.password.length);
        
        const salt = await bcrypt.genSalt(10);
        console.log('Generated salt:', salt);
        
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Hashed password:', this.password);
        
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 