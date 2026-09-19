function layout(bodyHtml: string): string {
  return `
    <div style="background:#0d0620;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#160b30;border-radius:12px;padding:32px;color:#f5f5f7;">
        <p style="font-size:20px;font-weight:700;margin:0 0 24px;">
          <span style="color:#ff2fb0;">RunThe</span><span style="color:#3dd6ff;">Mic</span>
        </p>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function button(url: string, label: string): string {
  return `
    <a href="${url}" style="display:inline-block;background:#d946ef;color:#0d0620;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;margin:16px 0;">
      ${label}
    </a>
  `;
}

export function verificationEmailHtml({ name, verifyUrl }: { name: string; verifyUrl: string }): string {
  return layout(`
    <h1 style="font-size:18px;margin:0 0 12px;">Welcome, ${name}!</h1>
    <p style="font-size:14px;color:#c9c3dc;line-height:1.6;margin:0 0 8px;">
      Confirm your email to start hosting karaoke nights on RunTheMic.
    </p>
    ${button(verifyUrl, "Verify email")}
    <p style="font-size:12px;color:#8b83a3;line-height:1.6;margin:16px 0 0;">
      This link expires in 24 hours. If the button doesn't work, paste this into your browser:<br>
      <a href="${verifyUrl}" style="color:#3dd6ff;word-break:break-all;">${verifyUrl}</a>
    </p>
  `);
}
