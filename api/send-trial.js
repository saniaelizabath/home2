import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Set CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { name, phone, email, subject, cls } = req.body;

    if (!name || !phone || !email || !subject || !cls) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'commerceacademy2026@gmail.com',
            replyTo: email,
            subject: `New Free Trial Booking: ${name}`,
            text: `
        You have received a new free trial booking request.
        
        Details:
        Name: ${name}
        Phone: ${phone}
        Email: ${email}
        Subject: ${subject}
        Class: ${cls}
      `,
            html: `
        <h3>New Free Trial Booking</h3>
        <p>You have received a new free trial booking request with the following details:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Class:</strong> ${cls}</li>
        </ul>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Trial booking email sent:', info.response);

        return res.status(200).json({ message: 'Trial booking email sent successfully' });

    } catch (error) {
        console.error('Error sending trial booking email:', error);
        return res.status(500).json({ message: 'Failed to send trial booking email', error: error.message });
    }
}
