<?php
// Only display errors in development environment
if ($_SERVER['REMOTE_ADDR'] == '127.0.0.1' || $_SERVER['REMOTE_ADDR'] == '::1') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Your email address
$to_email = "breazyproductions7@gmail.com"; // Changed to match your website
$subject_prefix = "Breazy Productions Booking: ";

// Set content type to JSON
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get and sanitize form data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $event_type = filter_input(INPUT_POST, 'event_type', FILTER_SANITIZE_STRING);
    $booking_date = filter_input(INPUT_POST, 'booking_date', FILTER_SANITIZE_STRING);
    $message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);
    
    // Validate required fields
    $errors = [];
    if (empty($name)) $errors[] = "Name is required";
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Valid email is required";
    if (empty($phone)) $errors[] = "Phone number is required";
    if (empty($event_type)) $errors[] = "Event type is required";
    if (empty($booking_date)) $errors[] = "Booking date is required";
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => implode(", ", $errors)
        ]);
        exit();
    }
    
    // Email subject
    $email_subject = $subject_prefix . $event_type . " - " . $name;
    
    // Email body with better formatting
    $email_body = "New Booking Request Received:\n\n";
    $email_body .= "Name: " . $name . "\n";
    $email_body .= "Email: " . $email . "\n";
    $email_body .= "Phone: " . $phone . "\n";
    $email_body .= "Event Type: " . $event_type . "\n";
    $email_body .= "Preferred Date & Time: " . $booking_date . "\n\n";
    $email_body .= "Message:\n" . $message . "\n\n";
    $email_body .= "---\nThis message was sent from the booking form on Breazy Productions website";
    
    // Secure headers to prevent email injection
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email
    $mail_result = mail($to_email, $email_subject, $email_body, $headers);
    
    if ($mail_result) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Thank you! Your booking request has been sent successfully.'
        ]);
        exit();
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Sorry, there was an error sending your message. Please try again.'
        ]);
        exit();
    }
} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit();
}
?>