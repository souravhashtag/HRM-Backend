const Joi = require('joi');

const loginSchema = Joi.object({
    username: Joi.string().required().trim().lowercase(),
    password: Joi.string().required(),
});

const registerSchema = Joi.object({
    employeeId: Joi.string()
        .uppercase()
        .trim()
        .required()
        .pattern(/^EMP\d{3,}$/)
        .message('Employee ID must be in format EMP001'),
    username: Joi.string()
        .lowercase()
        .trim()
        .min(3)
        .max(50)
        .required()
        .pattern(/^[a-z0-9._-]+$/)
        .message('Username can only contain lowercase letters, numbers, and .-_'),
    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .message('Password must contain uppercase, lowercase, number, and special character'),
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .message('Password must contain uppercase, lowercase, number, and special character'),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
        .min(8)
        .max(100)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .message('Password must contain uppercase, lowercase, number, and special character'),
});

module.exports = {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
};
