
'use strict'
const nodemailer = require('nodemailer')
const emailConfig = require('../config/config.js').emailConfig
const log = require('./log.js')
// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing

/**
 * 发送邮件
 *
 * @param {string} to 收邮地址
 * @param {string} subject 主题
 * @param {string} text 内容
 * @param {string} html html内容
 */
function sentEmail (to, subject, text, html) {
  let mailOptions = {
    from: '"koa" ' + emailConfig.auth.user, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html // html body
  }
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(emailConfig)

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error)
      log.error(error)
    } else {
        // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return log.error(error)
        }
      })
    }
  })
}

// TODO:发送验证邮箱
module.exports = {
  sentEmail: sentEmail
}
