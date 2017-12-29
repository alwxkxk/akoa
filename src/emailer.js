
'use strict'
const nodemailer = require('nodemailer')
const emailConfig = require('../config/config.js').emailConfig
const serverUrl = require('../config/config.js').serverUrl
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
        // 显示发送邮件的信息
        // console.log(info)
      })
    }
  })
}

/**
 * 用户发送 设置邮箱的邮件
 *
 * @param {string} to 目标邮箱
 * @param {string} sensitiveToken
 */
function userSetEmail (to, sensitiveToken) {
  const text = '你好，akoa设置邮箱，点击' + serverUrl + '/api/sensitiveToken/' + sensitiveToken + '/email/' + to + ' ,设置你的用户邮箱。（如果不是你本人操作，请勿点击。）'
  sentEmail(to, '用户邮箱设置', text)
}

function forgetPassword (to, name, newpassword) {
  const text = '你好，akoa网，你的用户名：' + name + '，你的新密码是' + newpassword + '。登陆后请修改密码。'
  sentEmail(to, '忘记密码', text)
}

module.exports = {
  sentEmail: sentEmail,
  userSetEmail: userSetEmail,
  forgetPassword: forgetPassword
}
