const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createLeaveSchema = Joi.object({
    leaveType: Joi.string().valid('casual', 'sick', 'earned', 'compOff').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    totalDays: Joi.number().integer().min(0.5).required(),
    reason: Joi.string().max(500).required(),
    attachments: Joi.array().items(
        Joi.object({
            fileName: Joi.string(),
            fileUrl: Joi.string().uri(),
        })
    ),
});

const updateLeaveStatusSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    reviewComments: Joi.string().max(500),
});

const leaveQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    employeeId: objectIdSchema,
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
    leaveType: Joi.string().valid('casual', 'sick', 'earned', 'compOff'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
});

module.exports = {
    createLeaveSchema,
    updateLeaveStatusSchema,
    leaveQuerySchema,
};
