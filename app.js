const express = require('express');
const morgan = require('morgan'); //middleware 3rd party
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes');
const app = express();
const baseURL = '/api/v1';

//1 MIDDLEWARE
app.use(morgan('dev'));
app.use(express.static(`${__dirname}/public`));
//use it mean use middleware
app.use(express.json()); //middleware

app.use((req, res, next) => {
  //custom middleware
  //alway call next function, if no, it can not be continue  middleware stack
  console.log('Middleware run with all route');

  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //cái này định nghĩa phương thức requestTime
  //và ở route req sẽ có thêm phương thức requestTime
  next();
});
// app.get('/', (req, res) => {
//   //   res.status(200).send('Hello from the server side');
//   res
//     .status(200) //default
//     .json({ message: 'Hello from the server side', app: 'Natours' });
// });
// app.post('/', (req, res) => {
//   res.send('you can post to this');
// });

//2 ROUTE HANDLER

//3 ROUTE
// app.get(`${baseURL}/tours`, getAllTours);
// app.get(`${baseURL}/tours/:id`, getTourById);
// app.post(`${baseURL}/tours`, createTour);
// app.patch(`${baseURL}/tours/:id`, updateTour);
// app.delete(`${baseURL}/tours/:id`, deleteTour);

//better way

//user route

app.use(`${baseURL}/tours`, tourRouter); //middleware for specific route
app.use(`${baseURL}/users`, userRouter);

//phải để unhandle route ở cuối vì khi 2 cái rout bên trên được chạy thì nó sẽ sang 1 route khác
// và cái unhandle này sẽ không được chạy
//ngược lại nếu 2 cái route ở trên không được chạy thì thg unhandle này sẽ được chạy
//cái này thuộc về middleware stack, thứ tự stack sẽ là thứ tự được viết trong code
//UNHANDLE ROUTE MIDDLEWARE
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // (err.status = 'fail'), (err.statusCode = 404);
  //Khi pass argument vào thg next thì tất cả arg đó đều là error.
  //Và nó sẽ skip tất cả các middleware trong stack và nhảy luôn vào thg middleware error global
  next(
    //app error sẽ có các thuộc tính như statusCode, status, message, stackTracem,isOperational
    new AppError(`Can't find ${req.originalUrl} on this server`, 404)
  );
});

//GLOBAL ERROR MIDDLEWARE
app.use(globalErrorHandler);
//4. START THE SERVER

module.exports = app;
