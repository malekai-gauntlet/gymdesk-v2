import { Resend } from 'resend';

const resend = new Resend('re_ASc9f7vm_Ca29PnXXc4DeKzifouJpaAyG');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'malekai.mischke@gauntletai.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});