<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Your email address
$to_email = "olagomez@live.co.uk";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Debug: Print received data
    echo "Form data received:<br>";
    print_r($_POST);
    echo "<br><br>";

    // Get form data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $event_type = filter_input(INPUT_POST, 'event_type', FILTER_SANITIZE_STRING);
    $message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);

    // Debug: Print filtered data
    echo "Filtered data:<br>";
    echo "Name: $name<br>";
    echo "Email: $email<br>";
    echo "Phone: $phone<br>";
    echo "Event Type: $event_type<br>";
    echo "Message: $message<br><br>";

    // Email subject
    $email_subject = "New Booking Request from $name";

    // Simple email body for testing
    $email_body = "Name: $name\nEmail: $email\nPhone: $phone\nEvent Type: $event_type\nMessage: $message";

    // Basic headers for testing
    $headers = "From: $email";

    // Debug: Print email details
    echo "Attempting to send email with:<br>";
    echo "To: $to_email<br>";
    echo "Subject: $email_subject<br>";
    echo "Headers: $headers<br><br>";

    // Try to send email
    $mail_result = mail($to_email, $email_subject, $email_body, $headers);
    
    // Debug: Print mail result
    echo "Mail function returned: " . ($mail_result ? "TRUE" : "FALSE") . "<br>";
    echo "Last error: " . error_get_last()['message'] . "<br>";

    // Comment out the redirects for testing
    /*
    if ($mail_result) {
        header("Location: book.html?status=success#booking");
        exit();
    } else {
        header("Location: book.html?status=error#booking");
        exit();
    }
    */
}
?> 