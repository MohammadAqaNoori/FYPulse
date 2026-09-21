import re

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w{2,}$")


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))


def is_strong_password(password: str) -> bool:
    """At least 8 chars, one digit, one letter."""
    if len(password) < 8:
        return False
    if not any(c.isdigit() for c in password):
        return False
    if not any(c.isalpha() for c in password):
        return False
    return True
