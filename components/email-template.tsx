interface EmailTemplateProps {
  title: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
  note?: string;
}

export const EmailTemplate = ({
  title,
  content,
  buttonText,
  buttonLink,
  note
}: EmailTemplateProps) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .message {
      font-size: 16px;
      line-height: 1.7;
      color: #4b5563;
      margin-bottom: 30px;
    }
    
    .button {
      display: inline-block;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 32px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .token {
      background: #f8f9fa;
      border: 2px dashed #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    
    .token-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: black;
    }
    
    .note {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 25px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #1e40af;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-links a {
      margin: 0 10px;
      color: #6b7280;
      text-decoration: none;
    }
    
    @media (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 8px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .token-code {
        font-size: 24px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">altbet</div>
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      <div class="message">
        ${content}
      </div>
      
      ${buttonText && buttonLink ? `
        <div style="text-align: center;">
          <a href="${buttonLink}" class="button">${buttonText}</a>
        </div>
      ` : ''}
      
      ${note ? `
        <div class="note">
          <strong>Note:</strong> ${note}
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>If you didn't request this email, you can safely ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} altbet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};