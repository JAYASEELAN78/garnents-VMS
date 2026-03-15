const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
    // Demo: uses ethereal or gmail if configured
    // For production, use service like SendGrid or AWS SES
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: process.env.EMAIL_PORT || 587,
        auth: {
            user: process.env.EMAIL_USER || 'demo_user',
            pass: process.env.EMAIL_PASS || 'demo_pass',
        },
    })

    const message = {
        from: `"V.M.S GARMENTS" <${process.env.EMAIL_FROM || 'no-reply@vmsgarments.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    }

    await transporter.sendMail(message)
}

module.exports = sendEmail
