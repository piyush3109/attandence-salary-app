const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    orgId: {
        type: String,
        default: 'default'
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    position: {
        type: String,
        required: true,
    },
    salaryRate: {
        type: Number,
        required: true,
    },
    rateType: {
        type: String,
        enum: ['per_day', 'per_hour'],
        default: 'per_day',
    },
    profilePhoto: {
        type: String,
        default: '',
    },
    guarantor: {
        name: String,
        phone: String,
        relation: String,
    },
    role: {
        type: String,
        enum: ['employee', 'manager', 'ceo'],
        default: 'employee'
    },
    active: {
        type: Boolean,
        default: true
    },
    contractType: {
        type: String,
        enum: ['Full-time', 'Freelance', 'Contract', 'Intern'],
        default: 'Full-time'
    },
    contractEndDate: {
        type: Date
    },
    gamification: {
        points: { type: Number, default: 0 },
        attendanceStreak: { type: Number, default: 0 },
        badges: [{
            name: String,
            icon: String,
            unlockedAt: { type: Date, default: Date.now }
        }]
    },
    skills: [{
        name: String,
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' }
    }],
    documents: [{
        title: String,
        url: String,
        category: String, // changed 'type' to 'category' to avoid conflict
        uploadedAt: { type: Date, default: Date.now }
    }],
    theme: {
        type: String,
        default: 'light'
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Onboarding', 'Probation', 'Active', 'Exited'],
        default: 'Probation'
    },
    probationEnd: {
        type: Date
    },
    exitDate: {
        type: Date
    },
    exitReason: {
        type: String
    },
    offboardingChecklist: [{
        item: String,
        completed: { type: Boolean, default: false },
        completedAt: Date
    }]
}, { timestamps: true });

const bcrypt = require('bcryptjs');

employeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
