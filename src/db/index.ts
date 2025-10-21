import { createConnection } from 'typeorm';
import { User } from '../models/user.model';
import { TimeAccount } from '../models/timeaccount.model';
import { config } from '../config/default';

const connection = createConnection({
    type: 'mysql',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [User, TimeAccount],
    synchronize: true,
    logging: false,
}).then(() => {
    console.log('Database connection established');
}).catch(error => {
    console.error('Database connection error:', error);
});

export default connection;