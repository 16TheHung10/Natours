const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DB.replace(
  '<PASSWORD>',
  process.env.DB_PASSWORD
);
console.log(process.env.DB);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connect) => {
    console.log('DB connection successful!');
  });
//Read json file
const tours = JSON.parse(
  fs.readFileSync(
    `${__dirname}/tours-simple.json`,
    'utf-8',
    (err) => {
      console.log(err);
    }
  )
);
//import data into db
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
//Delete all data from db
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully Delete!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);
//node dev-data/data/import-dev-data.js --import
//node dev-data/data/import-dev-data.js --delete
