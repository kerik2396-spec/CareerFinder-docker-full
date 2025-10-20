import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from flask import current_app

class EmailService:
    @staticmethod
    def send_email(to_email, subject, body):
        try:
            if not current_app.config.get('MAIL_USERNAME'):
                print(f'Would send email to {to_email}: {subject}')
                return True
            
            msg = MimeMultipart()
            msg['From'] = current_app.config['MAIL_USERNAME']
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MimeText(body, 'html'))
            
            server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
            server.starttls()
            server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
            server.send_message(msg)
            server.quit()
            
            return True
        except Exception as e:
            current_app.logger.error(f'Email sending error: {str(e)}')
            return False
    
    @staticmethod
    def send_welcome_email(user):
        subject = 'Welcome to CareerFinder!'
        body = f'''
        <h1>Welcome to CareerFinder, {user.username}!</h1>
        <p>Thank you for registering with CareerFinder.</p>
        <p>Start exploring job opportunities or posting vacancies today!</p>
        '''
        return EmailService.send_email(user.email, subject, body)
    
    @staticmethod
    def send_application_notification(application):
        subject = 'New Application Received'
        body = f'''
        <h1>New Application</h1>
        <p>You have received a new application for your vacancy: {application.vacancy.title}</p>
        <p>Applicant: {application.applicant.full_name}</p>
        <p>Login to your dashboard to review the application.</p>
        '''
        employer_email = application.vacancy.employer.email
        return EmailService.send_email(employer_email, subject, body)
