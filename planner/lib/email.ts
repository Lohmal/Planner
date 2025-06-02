import nodemailer from 'nodemailer';

// Email gönderici konfigürasyonu
// Not: Production ortamında gerçek SMTP ayarları kullanılmalıdır
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'your-password',
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * E-posta gönderme fonksiyonu
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // E-posta gönderimi
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Planner App" <your-email@gmail.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    return true;
  } catch (error) {
    console.error('E-posta gönderilirken hata:', error);
    return false;
  }
}

/**
 * Şifre sıfırlama e-postası gönderme
 */
export async function sendPasswordResetEmail(email: string, tempPassword: string): Promise<boolean> {
  const subject = 'Planner - Şifre Sıfırlama';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6cf7;">Planner - Şifre Sıfırlama</h2>
      <p>Merhaba,</p>
      <p>Şifre sıfırlama talebiniz için geçici şifreniz aşağıda verilmiştir:</p>
      <div style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; margin: 20px 0; font-family: monospace; font-size: 18px;">
        ${tempPassword}
      </div>
      <p>Bu geçici şifre ile giriş yapabilir ve ardından güvenlik için profil sayfanızdan şifrenizi değiştirmenizi öneririz.</p>
      <p>Şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı dikkate almayınız.</p>
      <p>Saygılarımızla,<br>Planner Ekibi</p>
    </div>
  `;
  
  const text = `
    Planner - Şifre Sıfırlama
    
    Merhaba,
    
    Şifre sıfırlama talebiniz için geçici şifreniz aşağıda verilmiştir:
    
    ${tempPassword}
    
    Bu geçici şifre ile giriş yapabilir ve ardından güvenlik için profil sayfanızdan şifrenizi değiştirmenizi öneririz.
    
    Şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı dikkate almayınız.
    
    Saygılarımızla,
    Planner Ekibi
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
