require('dotenv').config()
const { Sequelize } = require('sequelize')
const pg = require('pg')

const sequelize = new Sequelize(`postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGSERVER}`, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true,
    },
    keepAlive: true,
  },
  pool:{
    max: 100,
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 20000
  },
  logging: false
})

// Function made to test the connection to the database when the server starts. It is called in the app.js file.
async function testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Connection to PostgreSQL has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database. Error:', error);
    }
}
  
testConnection();

// Export the sequelize instance for use in other files
module.exports = sequelize;