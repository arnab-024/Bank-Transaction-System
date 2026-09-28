const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
  tls: {
    rejectUnauthorized: false, // ← add this!
  }
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"SBI Bank" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

/*console.log({
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
});*/ 

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to SBI Bank!";
  const text = `Hello ${name},\n\nThank you for registering with SBI Bank. We're excited to have you on board!`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering with <strong>SBI Bank</strong>. We're excited to have you on board!</p>`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Successful Transaction Notification from SBI Bank";
  const text = `Hello ${name}, Your transaction of $${amount} to account ${toAccount} was successful`;
  const html = `<p>Hello ${name}, </p><p>Your Transaction of $${amount} to account ${toAccount} was successful`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendFailedTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Failed Transaction Notification from SBI Bank";
  const text = `Hello ${name}, Your transaction of $${amount} to account ${toAccount} was unsuccessful`;
  const html = `<p>Hello ${name}, </p><p>Your Transaction of $${amount} to account ${toAccount} was unsuccessful`;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendFailedTransactionEmail };
