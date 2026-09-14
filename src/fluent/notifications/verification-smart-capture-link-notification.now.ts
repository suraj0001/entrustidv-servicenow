import "@servicenow/sdk/global";
import { EmailNotification, Record } from "@servicenow/sdk/core";
import { VERIFICATION_REQUEST_CREATED_EVENT } from "../../server/constants.ts";

export const VerificationRequestCreatedEvent = Record({
  $id: Now.ID["verification-request-created-event"],
  table: "sysevent_register",
  data: {
    event_name: VERIFICATION_REQUEST_CREATED_EVENT,
    table: "x_entru_entrustidv_verification_request",
    description: "Triggered after an Entrust identity verification workflow has been created.",
  },
});

export const NotificationIconUrlMailScript = Record({
  $id: Now.ID["notification-icon-url-mail-script"],
  table: "sys_script_email",
  data: {
    name: "Entrust IDV Notification Icon URL",
    new_lines_to_html: false,
    script: `(function runMailScript(current, template) {
    var instanceUrl = gs.getProperty("glide.servlet.uri") || "";
    if (instanceUrl && instanceUrl.charAt(instanceUrl.length - 1) !== "/") {
        instanceUrl += "/";
    }
    template.print(instanceUrl + "x_entru_entrustidv/notifications/entrust-icon.png");
})(current, template);`,
  },
});

export const LinkExpiryMailScript = Record({
  $id: Now.ID["link-expiry-mail-script"],
  table: "sys_script_email",
  data: {
    name: "Entrust IDV Link Expiry",
    new_lines_to_html: false,
    script: `(function runMailScript(current, template) {
    var expiresAt = current.getElement("expires_at").getGlideObject();
    var subjectUser = current.getElement("subject_user").getRefRecord();
    var timeZone = subjectUser.isValidRecord() ? subjectUser.getValue("time_zone") : "";
    if (timeZone) {
        expiresAt.setTimeZone(timeZone);
    }
    template.print(expiresAt.getDisplayValueLang("long", "en"));
})(current, template);`,
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
    subject: "Action required: complete identity verification for ${event.parm2}",
    messageHtml: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f3f5f7; margin:0; padding:0;">
            <tr>
                <td align="center" style="padding:32px 16px;">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border:1px solid #d9dee3; border-radius:6px;">
                        <tr>
                            <td style="padding:18px 32px; background-color:#17324d;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                                    <tr>
                                        <td style="color:#ffffff; font-family:Verdana, sans-serif; font-size:20px; font-weight:bold; white-space:nowrap;">
                                            <span style="display:inline-block; margin-right:10px; padding:6px; border:1px solid #ffffff; font-size:12px; line-height:1; vertical-align:middle;">SN</span>
                                            <span style="vertical-align:middle;">ServiceNow</span>
                                        </td>
                                        <td align="right" style="padding-left:16px;">
                                            <img src="\${mail_script:Entrust IDV Notification Icon URL}" width="166" height="30" alt="Powered by Entrust" style="display:block; width:166px; height:30px; border:0;" />
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px; color:#263746; font-family:Verdana, sans-serif; font-size:15px; line-height:1.6;">
                                <h1 style="margin:0 0 28px; color:#202936; font-family:Verdana, sans-serif; font-size:24px; line-height:1.3;">Verify your identity</h1>
                                <p style="margin:0 0 8px;">Hello \${subject_user.first_name},</p>
                                <p style="margin:0 0 24px;">ServiceNow asked you to verify your identity for case <strong>\${event.parm2}</strong>.</p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                                    <tr>
                                        <td style="background-color:#4F52BD; border-radius:4px;">
                                            <a href="\${event.parm1}" style="display:inline-block; padding:13px 22px; color:#ffffff; font-family:Verdana, sans-serif; font-size:15px; font-weight:bold; text-decoration:none;">Start identity verification</a>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#eef2f5; border:1px solid #c8d1da; border-radius:4px;">
                                    <tr>
                                        <td style="padding:20px; color:#263746; font-family:Verdana, sans-serif; font-size:13px; line-height:1.6;">
                                            <p style="margin:0 0 8px;"><strong>Keep this link private</strong></p>
                                            <p style="margin:0 0 8px;">This link is unique to you and expires on \${mail_script:Entrust IDV Link Expiry}. Don't forward this email or share the link.</p>
                                            <p style="margin:20px 0 0;"><strong>Didn't expect this request?</strong> Don't use the link.</p>
                                            <p style="margin:20px 0 0;"><strong>Need help?</strong> Contact customer support.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:20px 32px; border-top:1px solid #e3e7ea; color:#6a7884; font-family:Verdana, sans-serif; font-size:12px; line-height:1.5;">
                                This automated email was sent for case \${event.parm2}.<br />
                                Replies to this inbox aren't monitored.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`,
    messageText: `Verify your identity

Hello \${subject_user.first_name},

ServiceNow asked you to verify your identity for case \${event.parm2}.

Start identity verification: \${event.parm1}

Keep this link private
This link is unique to you and expires on \${mail_script:Entrust IDV Link Expiry}. Don't forward this email or share the link.

Didn't expect this request? Don't use the link.

Need help? Contact customer support.

This automated email was sent for case \${event.parm2}.
Replies to this inbox aren't monitored.`,
    omitWatermark: true,
    forceDelivery: true,
  },
});
