document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const requestForm = document.getElementById('request-form');
    const approvalButtons = document.querySelectorAll('.approve-button');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(loginForm);
            fetch('/api/auth/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/dashboard';
                } else {
                    alert(data.message);
                }
            });
        });
    }

    if (requestForm) {
        requestForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(requestForm);
            fetch('/api/timeaccount/request', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Request submitted successfully!');
                    requestForm.reset();
                } else {
                    alert(data.message);
                }
            });
        });
    }

    approvalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.dataset.requestId;
            fetch(`/api/admin/approve/${requestId}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Request approved successfully!');
                    location.reload();
                } else {
                    alert(data.message);
                }
            });
        });
    });
});