
export const forgotPasswordOtpEmail = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forgot Password OTP</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Tahoma,Verdana,Segoe,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:50px 0;">
<tr>
<td align="center">

<table width="500" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:6px;">

<tr>
<td align="center" style="padding:25px 20px 10px;">

<img
src="https://res.cloudinary.com/dd62irk0g/image/upload/v1782900519/logo-black1_jyozuq.jpg"
alt="Logo"
width="250"
style="display:block;max-width:250px;width:100%;height:auto;"
>

</td>
</tr>

<tr>
<td align="center" style="padding:10px 20px;">
<h1 style="
margin:0;
color:#393d47;
font-size:28px;
font-weight:700;
">
Password Reset OTP
</h1>
</td>
</tr>

<tr>
<td style="padding:10px 30px;">
<p style="
margin:0;
font-size:15px;
line-height:24px;
color:#393d47;
text-align:center;
">
We received a request to reset your password.
Use the One-Time Password (OTP) below to continue
the password reset process.
</p>
</td>
</tr>

<tr>
<td align="center" style="padding:20px;">
<h1 style="
margin:0;
font-size:42px;
font-weight:700;
color:#7747FF;
letter-spacing:4px;
">
${otp}
</h1>
</td>
</tr>

<tr>
<td style="padding:0 30px 20px;">
<p style="
margin:0;
font-size:14px;
line-height:24px;
color:#393d47;
text-align:center;
">
<strong>Note:</strong> This OTP is valid for 10 minutes.
Do not share this OTP with anyone.
</p>
</td>
</tr>

<tr>
<td style="padding:0 30px 20px;">
<p style="
margin:0;
font-size:14px;
line-height:24px;
color:#393d47;
text-align:center;
">
If you did not request a password reset,
please ignore this email.
</p>
</td>
</tr>

<tr>
<td style="padding:0 30px 30px;">
<p style="
margin:0;
font-size:14px;
line-height:24px;
color:#393d47;
text-align:center;
">
Thank you,<br>
<a
href="https://dhannajay.carrd.co/"
target="_blank"
style="color:#393d47;text-decoration:none;"
>
Developer Dhannajay Pandey
</a>
</p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
};
