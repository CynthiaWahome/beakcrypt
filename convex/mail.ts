"use node";

import { v } from "convex/values";
import * as nodemailer from "nodemailer";
import { Effect, Context, Layer } from "effect";
import { render } from "@react-email/components";
import { WelcomeEmail } from "../emails/welcome";
import { InviteUserEmail } from "../emails/invite";
import { internalAction } from "./_generated/server";
import { KeyApprovalEmail } from "../emails/key-approval";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { SessionApprovalEmail } from "../emails/session-approval";

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    send: (
      options: nodemailer.SendMailOptions,
    ) => Effect.Effect<{ messageId: string }, Error>;
  }
>() {}

const make = Effect.sync(() => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return EmailService.of({
    send: (options) =>
      Effect.tryPromise({
        try: () =>
          transporter.sendMail({
            from: process.env.EMAIL_FROM,
            ...options,
          }),
        catch: (error) => new Error(String(error)),
      }).pipe(
        Effect.map((result: SMTPTransport.SentMessageInfo) => ({
          messageId: result.messageId,
        })),
      ),
  });
});

export const EmailServiceLive = Layer.effect(EmailService, make);

export const sendInviteMail = internalAction({
  args: {
    url: v.string(),
    email: v.string(),
    orgName: v.string(),
    invitedByEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const emailHtml = await render(
      InviteUserEmail({
        inviteLink: args.url,
        userEmail: args.email,
        orgName: args.orgName,
        invitedByEmail: args.invitedByEmail,
      }),
    );

    const program = Effect.gen(function* () {
      const emailService = yield* EmailService;
      return yield* emailService.send({
        to: args.email,
        html: emailHtml,
        subject: `Join ${args.orgName} on Beakcrypt`,
      });
    });

    await Effect.runPromise(program.pipe(Effect.provide(EmailServiceLive)));
  },
});

export const sendWelcomeMail = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const emailHtml = await render(
      WelcomeEmail({
        email: args.email,
      }),
    );

    const program = Effect.gen(function* () {
      const emailService = yield* EmailService;
      return yield* emailService.send({
        to: args.email,
        subject: "Welcome to Beakcrypt",
        html: emailHtml,
      });
    });

    await Effect.runPromise(program.pipe(Effect.provide(EmailServiceLive)));
  },
});

export const sendKeyApprovalMail = internalAction({
  args: {
    memberEmail: v.string(),
    orgName: v.string(),
    orgSlug: v.string(),
    keyId: v.string(),
    adminEmails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const approveLink = `${process.env.SITE_URL}/${args.orgSlug}/teams?approveKey=${args.keyId}`;

    const emailHtml = await render(
      KeyApprovalEmail({
        memberEmail: args.memberEmail,
        orgName: args.orgName,
        approveLink,
      }),
    );

    const program = Effect.gen(function* () {
      const emailService = yield* EmailService;
      for (const adminEmail of args.adminEmails) {
        yield* emailService.send({
          to: adminEmail,
          html: emailHtml,
          subject: `Key approval needed for ${args.memberEmail} in ${args.orgName}`,
        });
      }
    });

    await Effect.runPromise(program.pipe(Effect.provide(EmailServiceLive)));
  },
});

export const sendSessionApprovalMail = internalAction({
  args: {
    userEmail: v.string(),
    orgName: v.string(),
    orgSlug: v.string(),
    keyId: v.string(),
  },
  handler: async (ctx, args) => {
    const approveLink = `${process.env.SITE_URL}/${args.orgSlug}/sessions?approveSession=${args.keyId}`;

    const emailHtml = await render(
      SessionApprovalEmail({
        orgName: args.orgName,
        approveLink,
      }),
    );

    const program = Effect.gen(function* () {
      const emailService = yield* EmailService;
      return yield* emailService.send({
        to: args.userEmail,
        html: emailHtml,
        subject: `New device needs approval for ${args.orgName}`,
      });
    });

    await Effect.runPromise(program.pipe(Effect.provide(EmailServiceLive)));
  },
});
