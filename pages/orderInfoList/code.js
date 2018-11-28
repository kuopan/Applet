// pages/orderInfoList/code.js
var url = require('../../utils/url.js'),
  codeUrl = url.HOST;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qrcode: codeUrl + '/qrcode/qrcode/getQRCode', //二维码
    barcode: codeUrl + '/barCode/barCode/getBarCode' //条形码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //关闭转发按钮
    wx.hideShareMenu();
    var that = this,
      opt = options,
      flag = opt.flag,
      url = opt.url,
      codeUrl;
		let cinemaCode = '33018111' || '37063101' || '22021301' || '23012881' || '23060111' || '23050668' || '23050668' || '41073801' || '21130401' || '37157011' || '37037291' || '21015601' || '37037171' || '51010802';
   
    // 根据影城 cinemaCode 修改取票码 
    if (cinemaCode) {
      var url = opt.url;
      url = url.split(",").join("|")
      // console.log(ticketNo1)  
    } else if (opt.cinemaCode == '11051181') {
      var url = opt.url;
      url = url.split(",").join("")
      // console.log(ticketNo1);
    }
    if (flag == 1) {
      codeUrl = that.data.qrcode + "?content=" + url;
    } else if (flag == 0) {
      codeUrl = that.data.barcode + "?content=" + url;
    }

    that.setData({
      codeurl: codeUrl,
      codeFlag: flag
    });
    console.log(that.data.codeurl);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '订单详情',
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
});