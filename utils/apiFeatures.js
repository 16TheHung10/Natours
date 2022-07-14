class APIFeatures {
  constructor(query, queryFromReq) {
    //query là tất cả data cần lấy. ban đầu là Model.find()
    //sau đó là Model.find().someMethods().someMethods()...
    //rồi khi nào đã xong hết method cần sử dụng thì await query để lấy ra data cuối cùng
    //queryFromReq là những thứ user muốn như page bao nhiêu, sort field nào.... và từ đó sử dụng cho query
    this.query = query;
    this.queryFromReq = queryFromReq;
  }

  filter() {
    const queryObj = { ...this.queryFromReq };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    const queryObjKeys = Object.keys(queryObj);
    excludedFields.forEach((el) => delete queryObj[el]);
    queryObjKeys.forEach((key) => {
      if (!queryObj[key]) {
        delete queryObj[key];
      }
    });
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (newEl) => `$${newEl}`
    );
    this.query.find(JSON.parse(queryString));
    return this;
  }
  sort() {
    if (this.queryFromReq.sort) {
      const sortBy = this.queryFromReq.sort.split(',').join('');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryFromReq.fields) {
      const fields = this.queryFromReq.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //__v is internal value of express
    }
    return this;
  }
  pagination() {
    const page = this.queryFromReq.page * 1 || 1;
    const limit = this.queryFromReq.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
  search() {
    if (this.queryFromReq.keyword) {
      this.query = this.query.find({
        name: { $search: this.queryFromReq.keyword },
      });
    }
    return this;
  }
}
module.exports = APIFeatures;
