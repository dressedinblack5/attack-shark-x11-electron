# Security Policy

## Supported Versions

The following versions of Attack Shark X11 are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| < 1.4.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public issue on GitHub
2. Email the maintainer directly at: leonvargas4991@gmail.com
3. Include a detailed description of the vulnerability and steps to reproduce
4. Allow reasonable time for the issue to be addressed before disclosing publicly

## Security Measures

This project implements the following security measures:

- **Content Security Policy (CSP)**: Implemented in the renderer process to prevent XSS attacks
- **Context Isolation**: Enabled for secure IPC communication between main and renderer processes
- **Sandboxing**: Enabled for the renderer process (Electron security best practice)
- **Input Validation**: All user inputs are validated and sanitized before USB communication
- **Dependency Auditing**: Regular automated security audits via GitHub Actions
- **Dependabot**: Automated dependency updates for security patches
- **Code Signing**: Application is signed for distribution (where applicable)

## Known Security Considerations

- The application requires USB HID access to communicate with the mouse device
- Linux users must install udev rules to allow non-root access (see README)
- The application uses `sandbox: true` for the renderer process (Electron security best practice)

## Security Updates

Security updates will be released as patch versions (e.g., 1.2.1) and will be clearly noted in the CHANGELOG.

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities and help improve the security of this project.
