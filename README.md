# Time Account Management Application

This project is a dynamic web application designed for managing time accounts for users. It includes features for user authentication, time account management, and administrative approval processes.

## Features

- User authentication (login and registration)
- Time account management (create, update, retrieve)
- Administrative approval of time account requests via email
- Password protection for sensitive routes

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MySQL
- Docker

## Project Structure

```
time-account-app
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── services
│   ├── middlewares
│   ├── db
│   ├── config
│   ├── templates
│   └── types
├── public
│   ├── css
│   └── js
├── scripts
├── migrations
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd time-account-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.

4. Run database migrations:
   ```
   npm run migrate
   ```

5. Start the application:
   ```
   npm start
   ```

## Usage

- Access the application in your web browser at `http://localhost:3000`.
- Use the authentication routes to log in or register.
- Administrators can approve or reject time account requests via email notifications.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.