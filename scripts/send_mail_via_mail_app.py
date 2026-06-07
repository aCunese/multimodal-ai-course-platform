#!/usr/bin/env python3

from __future__ import annotations

import argparse
import subprocess
import sys


APPLESCRIPT_SOURCE = """
on run argv
	set recipientAddress to item 1 of argv
	set subjectLine to item 2 of argv
	set bodyText to item 3 of argv
	set accountName to item 4 of argv
	set senderAddress to item 5 of argv

	tell application "Mail"
		set outgoingMessage to make new outgoing message with properties {visible:false, subject:subjectLine, content:bodyText & return & return}
		tell outgoingMessage
			make new to recipient at end of to recipients with properties {address:recipientAddress}
			set sender to senderAddress
			send
		end tell
	end tell
end run
"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Send a plain-text email through the local macOS Mail app."
    )
    parser.add_argument("--to", required=True, help="Recipient email address.")
    parser.add_argument("--subject", required=True, help="Email subject line.")
    parser.add_argument(
        "--account-name",
        default="QQ",
        help="Mail account name to send from. Defaults to QQ.",
    )
    parser.add_argument(
        "--sender-email",
        default="946265043@qq.com",
        help="Sender email address configured in Mail.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate inputs and print a summary without sending email.",
    )
    return parser


def read_body() -> str:
    body = sys.stdin.read().strip()
    if not body:
        raise SystemExit("Email body is required via stdin.")
    return body


def send_mail(
    *,
    recipient: str,
    subject: str,
    body: str,
    account_name: str,
    sender_email: str,
) -> None:
    subprocess.run(
        [
            "osascript",
            "-e",
            APPLESCRIPT_SOURCE,
            recipient,
            subject,
            body,
            account_name,
            sender_email,
        ],
        check=True,
        text=True,
        capture_output=True,
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    body = read_body()

    if args.dry_run:
        preview = body.splitlines()[:3]
        print(f"to={args.to}")
        print(f"subject={args.subject}")
        print(f"account={args.account_name}")
        print(f"sender={args.sender_email}")
        print("body_preview=")
        print("\n".join(preview))
        return 0

    try:
        send_mail(
            recipient=args.to,
            subject=args.subject,
            body=body,
            account_name=args.account_name,
            sender_email=args.sender_email,
        )
    except subprocess.CalledProcessError as error:
        stderr = (error.stderr or "").strip()
        stdout = (error.stdout or "").strip()
        message = stderr or stdout or str(error)
        print(f"Failed to send mail through Mail.app: {message}", file=sys.stderr)
        return 1

    print(f"Sent email to {args.to} via Mail account {args.account_name}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
