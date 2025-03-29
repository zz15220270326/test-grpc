class BaseDTO {
  static success(data) {
    return {
      code: 0,
      data,
      msg: 'success',
    };
  }

  static error(msg, code = -1) {
    return {
      code,
      data: null,
      msg,
    };
  }
}

module.exports = BaseDTO;
