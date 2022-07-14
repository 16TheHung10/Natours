const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal 40 characters'],
      minlength: [10, 'A tour name must have more or equal 10 characters'],
      // validate: [validator.isAlpha, 'Them name only contain the letter'],
    },

    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    //custom validation
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          //Có nghĩa là this ở đây ko có tác dụng ở function update (Xem lại)
          return val < this.price;
        },
        //{VALUE}: this is operation of mongoose, it point to input value
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//MIDDLEWARE
//DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  // console.log('This is document', this);

  next();
});

tourSchema.pre('save', function (next) {
  // console.log('Pre 2');
  next();
});

tourSchema.post('save', function (doc, next) {
  //execute after all pre middleware is completed
  // console.log('final doc', doc);
  next();
});

//QUERRY MIDDLEWARE
// /^find/ mean all string start with "find"
tourSchema.pre(/^find/, function (next) {
  //Function này để người ta không lấy được những secretTour
  // console.log('query this', this);
  //this now is current querry not the document like save middleware
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //POST middleware Run after query is executed
  //docs is all document is returned from the query
  //ta có thể truy cập vapf docs này vì tại thời điểm này
  //docs đã được trả về bởi query tức là đã xong việc response data
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  //this is point to current aggregate object;
  // console.log('aggregate', this.pipeline());
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  next();
});
tourSchema.index({ name: 'text' });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
