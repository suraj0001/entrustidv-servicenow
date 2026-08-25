import "@servicenow/sdk/global";
import { EmailNotification, Record } from "@servicenow/sdk/core";
import { VERIFICATION_REQUEST_CREATED_EVENT } from "../../server/constants.ts";

export const VerificationRequestCreatedEvent = Record({
  $id: Now.ID["verification-request-created-event"],
  table: "sysevent_register",
  data: {
    event_name: VERIFICATION_REQUEST_CREATED_EVENT,
    table: "x_entru_entrustidv_verification_request",
    description:
      "Triggered after an Entrust identity verification workflow has been created.",
  },
});

export const VerificationSmartCaptureLinkNotification = EmailNotification({
  $id: Now.ID["verification-smart-capture-link-notification"],
  table: "x_entru_entrustidv_verification_request",
  name: "Entrust IDV Smart Capture Link",
  description: "Send an Entrust IDV Smart Capture link to the caller.",
  active: true,
  triggerConditions: {
    generationType: "event",
    eventName: VERIFICATION_REQUEST_CREATED_EVENT,
  },
  recipientDetails: {
    recipientFields: ["subject_user"],
    sendToCreator: false,
    isSubscribableByAllUsers: false,
  },
  emailContent: {
    contentType: "multipart/mixed",
        subject:
            "Action required: complete identity verification for ${event.parm2}",
    messageHtml: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f3f5f7; margin:0; padding:0;">
            <tr>
                <td align="center" style="padding:32px 16px;">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border:1px solid #d9dee3; border-radius:6px;">
                        <tr>
                            <td style="padding:24px 32px; background-color:#17324d; color:#ffffff; font-family:Verdana, sans-serif; font-size:20px; font-weight:bold;">
                                Entrust Identity Verification
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px; color:#263746; font-family:Verdana, sans-serif; font-size:15px; line-height:1.6;">
                                <p style="margin:0 0 20px;">Hello \${subject_user.first_name},</p>
                                <p style="margin:0 0 20px;">Please complete the identity verification requested for the case <strong>\${event.parm2}</strong></p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
                                    <tr>
                                        <td style="background-color:#176b5b; border-radius:4px;">
                                            <a href="\${event.parm1}" style="display:inline-block; padding:13px 22px; color:#ffffff; font-family:Verdana, sans-serif; font-size:15px; font-weight:bold; text-decoration:none;">Start identity verification</a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:0 0 12px; font-size:13px; color:#526574;"><strong>For your security:</strong></p>
                                <p style="margin:0 0 8px; font-size:13px; color:#526574;">This link is unique to your verification. Do not forward or share it.</p>
                                <p style="margin:0; font-size:13px; color:#526574;">If you were not expecting this request, do not open the link and contact your support team.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:20px 32px; border-top:1px solid #e3e7ea; color:#6a7884; font-family:Verdana, sans-serif; font-size:12px; line-height:1.5;">
                                This is an automated message regarding case \${event.parm2}. Please do not reply to this email.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`,
    messageText: `Hello \${subject_user.first_name},

Please complete the identity verification requested for case \${event.parm2}.

Start identity verification: \${event.parm1}

For your security, this link is unique to your verification. Do not forward or share it.

If you were not expecting this request, do not open the link and contact your support team.

This is an automated message. Please do not reply.`,
    omitWatermark: true,
    forceDelivery: true,
  },
});
