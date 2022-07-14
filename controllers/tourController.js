const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
exports.aliasTopTours = (req, res, next) => {
  //Lấy top 5: trước khi gửi request thì đi qua middleware này,
  // xong ở middleware này fix lại req gửi lên để tái sử dụng getAllTours
  req.query.limit = 5;
  req.query.sort = '-ratingAverage,price';
  req.query, (fields = 'name,price,ratingsAverage,summary,difficulty');
  next();
};
exports.getAllTours = catchAsync(async (req, res, next) => {
  //EXECUTE
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const tours = await features.query;
  //SEN RESPONSE
  res.status(200).json({
    status: 'success',
    requestAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});
exports.getTourById = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
exports.createTour = catchAsync(async (req, res, next) => {
  //   const newTour = new Tour({
  // //data
  //   })
  // newTour.save()
  //better way to create data in dbs
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
  // try {

  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err.message,
  //   });
  // }
});
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id, {
    rawResult: true,
  });
  if (!tour) {
    return next(new AppError('No tou found with that ID', 404));
  }
  if (!tour.value) {
    return next(
      new AppError('You do not have permission to delete this tour', 403)
    );
  }
  res.status(200).json({
    status: 'SUCCESS',
    data: tour,
  });
});
exports.getTourStats = catchAsync(async (req, res, next) => {
  //stat:thong ke
  // aggregate:: tong hop
  const query = { ...req.query };

  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: `$${query.fields}` },
        numTours: { $sum: 1 }, //loop and count per loop
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },

    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        avgPrice: -1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'SUCCESS',
    data: stats,
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    //unwind sẽ giải mã array fields và xuất ra từng phần tử của mảng
    //Ví dụ startDates = [1,2,3] thì nó sẽ lấy ra từng phần tử 1,2,3
    //và kèm theo đó là những data tương ứng cho mỗi giá trị
    //như là name,rating,price.....
    //Kết quả sẽ là:
    //[{ startDates:1,
    //name: name 1},
    //{startDates:2,
    //name:name 2}]
    { $unwind: '$startDates' },
    //Lấy từng thông tin tương ứng vs từng startDates
    //StartDates : Số thời gian của tour đó được bắt đầu
    {
      $match: {
        //Chỉ lấy thời gian trong năm ứng với req.year (2021)
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      //Nhóm chúng lại theo tháng
      $group: {
        _id: { $month: '$startDates' },
        numToursStart: { $sum: 1 },
        tours: { $push: '$name' }, //trong tháng đó có thể có nhiều tour nên dùng push để push từng tour đó vào 1 mảng
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        //Xóa _id ra khỏi res
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
    },
    { $limit: 2 },
  ]);
  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});
