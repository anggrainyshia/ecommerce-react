require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const ensureSchema = require('./config/ensureSchema');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await ensureSchema();
    console.log('Schema compatibility checks complete');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
