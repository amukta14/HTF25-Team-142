const cron = require('node-cron');
const Capsule = require('../models/Capsule');
const SharedCapsule = require('../models/SharedCapsule');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const unlockCapsulesJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('🔍 Checking for capsules to unlock...');
    const now = new Date();
    
    const capsulesToUnlock = await Capsule.find({
      unlockDate: { $lte: now },
      isLocked: true
    }).populate('user', 'email name');

    for (const capsule of capsulesToUnlock) {
      capsule.isLocked = false;
      await capsule.save();

      if (capsule.user?.email) {
        try {
          await transporter.sendMail({
            from: `"Time Capsule" <${process.env.EMAIL_USER}>`,
            to: capsule.user.email,
            subject: '🎉 Your Time Capsule is Unlocked!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                  <h1>🎉 Time Capsule Unlocked!</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <h2>Hello ${capsule.user.name},</h2>
                  <p>Your time capsule "<strong>${capsule.title}</strong>" is now unlocked!</p>
                  <p>Revisit your memories from the past.</p>
                  <a href="${process.env.FRONTEND_URL}/capsule/${capsule._id}" 
                     style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; 
                            text-decoration: none; border-radius: 5px; margin-top: 20px;">
                    Open Your Capsule
                  </a>
                </div>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Email error:', emailError.message);
        }
      }
    }

    if (capsulesToUnlock.length > 0) {
      console.log(`✅ Unlocked ${capsulesToUnlock.length} capsules`);
    }
  } catch (error) {
    console.error('❌ Unlock capsules error:', error);
  }
});

const deliverSharedCapsulesJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('🔍 Checking for shared capsules to deliver...');
    const now = new Date();
    
    const capsulesToDeliver = await SharedCapsule.find({
      deliveryDate: { $lte: now },
      isDelivered: false
    }).populate('sender', 'name email').populate('capsule', 'title');

    for (const shared of capsulesToDeliver) {
      shared.isDelivered = true;
      shared.deliveredAt = now;
      await shared.save();

      try {
        await transporter.sendMail({
          from: `"Time Capsule" <${process.env.EMAIL_USER}>`,
          to: shared.recipientEmail,
          subject: `📦 ${shared.sender.name} sent you a Time Capsule!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                <h1>📦 You Received a Time Capsule!</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2>Hello!</h2>
                <p><strong>${shared.sender.name}</strong> sent you a time capsule!</p>
                <p><strong>Title:</strong> ${shared.capsule.title}</p>
                ${shared.message ? `<p><strong>Message:</strong> ${shared.message}</p>` : ''}
                <div style="background: white; border: 2px dashed #667eea; padding: 15px; text-align: center; margin: 20px 0;">
                  <p>Access Code:</p>
                  <div style="font-size: 24px; font-weight: bold; color: #667eea;">${shared.accessCode}</div>
                </div>
                <a href="${process.env.FRONTEND_URL}/shared/${shared.accessCode}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px;">
                  Open Capsule
                </a>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Email error:', emailError.message);
      }
    }

    if (capsulesToDeliver.length > 0) {
      console.log(`✅ Delivered ${capsulesToDeliver.length} shared capsules`);
    }
  } catch (error) {
    console.error('❌ Deliver shared capsules error:', error);
  }
});

const startScheduler = () => {
  unlockCapsulesJob.start();
  deliverSharedCapsulesJob.start();
  console.log('✅ Scheduler started');
};

module.exports = { startScheduler };