// pages/confirmOrder/confirmOrder.js
import {
  $showToast
} from '../../utils/packaging.js';
var url = require('../../utils/url.js'),
  fn = require('../../utils/util.js'),
  logoutToken = fn.logoutToken,
  URL = url.confirmOrder, //获取订单信息的url
  voucherUrl = url.getvouchers, //获取卡、券信息的url
  bindOrderUrl = url.bindOrder,
  cancelOrderUrl = url.cancelOrder, //取消订单的url
  checkOrderStateUrl = url.checkOrderState,
  payExchange = url.payExchange, //0元对换券的支付接口
  checkCardPsw = url.checkCardPsw, //校验卡支付密码是否正确
  checkPosCardPsw = url.checkPosCardPsw,
  cardPayBack = url.cardPayBack, //校验完卡支付密码，用卡支付
  MillisecondToDate = fn.MillisecondToDate, //把ms单位的数据改为'mm:ss'
  initPay = url.initPay,
  orderNo,
  member,
  memberCode,
  cinemaCode,
  movieCode,
  token,
  CVersion,
  OS,
  goodsActual = 0, //卖品的卡或券优惠后金额
  ticketActual = 0, //影票的卡或券优惠后金额
  favorInfo, //从选卡券页面回到确认订单页所带回来的关于此订单的优惠信息
  orderType, //订单类型：独产卖品订单、影票订单
  bindType,
  preCardCode, //上一次选择的cardCode
  precardType, // 上一次选择的卡type
  preVoucherCode, //上一次选择的voucherCode
  dbClickFlag = true, //防止双击出现两个支付窗户
  skipFlag; //判断是否是0元对换券

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hideWin: true,
    // hideWin1: true,
    nocancel: true,
    buttonClicked: false,
    toastItem: {
      text: 'sucess!',
      toast_visible: !1
    },
    pswFlag: false, //输入密码弹框flag
    discounTMoney: 0, // 影票的优惠金额
    discountGMoney: 0, // 卖品的优惠金额
    bindType: -1, //bindType为：0：用户使用了会员卡，1：用户使用了优惠券
    perCardName: '', //上一次选择的卡：cardName
    detailsflag: false,
    shade: false,
    shade1: false,
    flag: false,
    dbClickFlag: true, //防止双击出现两个支付窗户
    psw: '',
    downFlag: 1,
    orderTimeOut: '',
    setTime: null,
    cinemaStatus: '1',
    theaterPhone: '',
    practical: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.hideShareMenu();

    var that = this,
      opt = options;

    orderNo = opt.orderNo;

    cinemaCode = wx.getStorageSync('cinemaCode');
    member = wx.getStorageSync('member');
    memberCode = member.memberCode;
    movieCode = wx.getStorageSync('movieCode');
    token = member.token;
    CVersion = wx.getStorageSync('CVersion');
    OS = wx.getStorageSync('OS');

    // that.ajaxFn();
  },

  //ajax fn
  ajaxFn: function() {
    var the = this,
      data, //承载订单信息数据
      vocherNum, //券张数
      discounTMoney = 0, // //影票用卡或券之后的优惠金额
      discounGMoney = 0, // // 卖品用卡或券之后的优惠金额

      orderConfirmPara = {
        'cinemaCode': cinemaCode,
        'memberCode': memberCode,
        'orderNo': orderNo,
        'prefAccount': '',
        'bindType': bindType
      }, //获取订单信息需要传的参数
      vocherInfoPara = {
        'cinemaCode': cinemaCode,
        'memberCode': memberCode,
        'orderNo': orderNo,
        'pageNo': 1,
        'voucherType': -1
      }; //获取卡、券列表需要传的参数

    if (favorInfo) {
      orderConfirmPara.prefAccount = favorInfo.preCardCode;
    }

    wx.request({
      url: URL,
      method: 'GET',
      data: orderConfirmPara,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        // console.log(res);
        var data = res.data.resultData,
          cinemaStatus = data.cinemaStatus,
          theaterPhone = data.theaterPhone;

        the.setData({
          theaterPhone,
          cinemaStatus
        });
        var goodsList = data.goods,

          goodsTotalPrice = 0; //卖品总价
        // storefrontTotalPrice = 0; //

        let goodsPrice = (data.goodsPrice).toFixed(2);
        let ticketFirstPrice = (data.ticketFirstPrice).toFixed(2);
        the.setData({
          practical: (ticketFirstPrice / 100) + (goodsPrice / 100)
        })

        data.payPrice = (data.payPrice / 100).toFixed(2);
        data.ticketPrice = (data.ticketPrice / 100).toFixed(2);
        data.filmNum = data.filmCount.replace("张", "");
        // data.resultPrice = [(data.ticketPrice - data.favorPrice)/100].toFixed(2);
        data.ticketFirstPrice = (data.ticketFirstPrice / 100).toFixed(2);
        data.goodsPrice = (data.goodsPrice / 100).toFixed(2);
        data.storefrontPrice = (data.storefrontPrice / 100).toFixed(2); //门市价
        orderType = data.orderType;

        data.orderPrice = data.orderPrice / 100;

        if (goodsList.length > 0) {
          for (var m = 0, mLen = goodsList.length; m < mLen; m++) {
            goodsList[m].goodsPrice = (goodsList[m].goodsPrice / 100).toFixed(2);
            goodsList[m].storefrontPrice = (goodsList[m].storefrontPrice / 100).toFixed(2);

            goodsTotalPrice += goodsList[m].goodsPrice * goodsList[m].amount;
            // storefrontTotalPrice += parseInt(goodsList[m].storefrontPrice) * goodsList[m].amount;
          }

        }
        data.ticketActual = data.ticketFirstPrice; //影票实付
        data.goodsActual = goodsTotalPrice.toFixed(2); //卖品实付
        // console.log(favorInfo)
        if (favorInfo) {
          data.resultPrice = (favorInfo.paymentAmount / 100); //优惠后，实付价
          discounTMoney = (favorInfo.covTdiscount / 100);
          discounGMoney = (favorInfo.covGdiscount / 100);
          data.ticketActual = (data.ticketFirstPrice - discounTMoney).toFixed(2);
          data.goodsActual = (goodsTotalPrice - discounGMoney).toFixed(2);

          if (discounTMoney == '' || discounTMoney == undefined || discounTMoney == null) {
            discounTMoney = 0
          }

          if (discounGMoney == '' || discounGMoney == undefined || discounGMoney == null) {
            discounGMoney = 0
          }

          var paymentAmount = favorInfo.paymentAmount;
          if (isNaN(paymentAmount)) {
            paymentAmount = ((favorInfo.paymentAmount).toFixed(2)) / 100;
          } else {
            paymentAmount = favorInfo.paymentAmount / 100;
          }
          if (paymentAmount == '' || paymentAmount == '0') {
            let deductAmount = favorInfo.deductAmount;
            if (isNaN(deductAmount) && deductAmount) {
              paymentAmount = ((favorInfo.deductAmount).toFixed(2)) / 100;
            } else if (discounTMoney != 0) {
              paymentAmount = (paymentAmount - discounTMoney).toFixed(2);
              if (paymentAmount < 0) {
                paymentAmount = 0;
              }
            } else {
              paymentAmount = favorInfo.deductAmount / 100;
            }
          }
          data.ServiceCharge = favorInfo.ServiceCharge;
        }
        the.setData({
          discounTMoney: discounTMoney,
          discounGMoney: discounGMoney,
          totalTGmoney: (discounTMoney + discounGMoney).toFixed(2),
          favorInfo: favorInfo,
          practical: paymentAmount
        });


        var money = 0,
          ticketActual = data.ticketActual,
          goodsActual = data.goodsActual;

        if (ticketActual != null && ticketActual != undefined) {
          money += Number(ticketActual);
        }
        if (goodsActual != null && goodsActual != undefined) {
          money += Number(goodsActual);
        }

        data.resultPrice = money.toFixed(2);

        if (data.favorPrice == '' || data.favorPrice == undefined || data.favorPrice == null) {
          data.favorPrice = 0;
        } else {
          data.favorPrice = (data.favorPrice / 100).toFixed(2);
        }

        if (data.confirmFlag == '1') {
          data.payPrice = (data.orderPrice - data.favorPrice).toFixed(2);
          // precardType = data.prefType;
          if (data.prefType == 0) {
            bindType = '-1';
          } else if (data.prefType == 1) {
            bindType = '0';
            the.setData({
              perCardName: data.prefName
            });
          } else if (data.prefType == 2) {
            bindType = '1';
            the.setData({
              preVoucherName: data.prefName
            });
          }

          if (data.payType == 102) {
            skipFlag = '1'
          } else {
            if (data.payType == 100) {
              precardType = '1';
              if (data.cardType == '10' || data.cardType == '11') {
                precardType = data.cardType;
              }
            }
          }

        }
        the.setData({
          msg: data,
        });

        //倒计时单位是ms，改为'mm:ss'
        if (data.orderTimeOut > 0) {
          var times = MillisecondToDate(data.orderTimeOut);
          data.orderTimeOut = times;
        } else {
          data.orderTimeOut = '0分0秒';
        }

        wx.request({
          url: voucherUrl,
          method: 'GET',
          data: vocherInfoPara,
          header: {
            'Content-Type': 'text/plain',
            'Accept': 'application/json'
          },
          success: function(res) {
            // console.log(res);
            var vocherData = res.data.resultData;
            vocherNum = vocherData.vouherCount;

            the.setData({
              vocherNum: vocherNum
            });
          },
          fail: function() {},
          complete: function() {}
        });
        // console.log(data.orderTimeOut)
        the.countDownFn(data.orderTimeOut);
      },
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    wx.setNavigationBarTitle({
      title: '确认订单',
    });
    this.ajaxFn();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this,
      prefCardName = '',
      prefVoucherName = '',
      flag = wx.getStorageSync('flag');
    that.setData({
      flag
    });
    // console.log(flag);
    favorInfo = wx.getStorageSync('favorInfo'); //从选卡券页进入确认订单页时（或者没有选卡券），此值为undefined
    bindType = wx.getStorageSync('bindType'); //从选卡券页进入确认订单页（或者没有选卡券）时，此值为undefined
    if (favorInfo && bindType != undefined) {
      favorInfo = JSON.parse(favorInfo);
      if (bindType == '0') {
        preCardCode = favorInfo.preCardCode;
        precardType = favorInfo.cardType;
        prefCardName = favorInfo.prefCardName;
      } else if (bindType == '1') {
        preVoucherCode = favorInfo.preVoucherCode;
        prefVoucherName = favorInfo.prefVoucherName;
      } else {
        bindType = '-1';
      }
      that.setData({
        bindType: bindType,
        perCardName: prefCardName,
        preVoucherName: prefVoucherName,
        downFlag: 1
      });

      //数据取出来之后把缓存清空
      wx.removeStorageSync('bindType');
      wx.removeStorageSync('favorInfo');
    } else {
      preCardCode = undefined;
      preVoucherCode = undefined;

      that.setData({
        bindType: '-1',
      });
      bindType: '-1';
    }
    setTimeout(function() {
      that.ajaxFn();
    }, 2000)

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    clearInterval(this.data.setTime);
    this.setData({
      orderTimeOut: ''
    })
  },

  //click to choose card
  chooseCard: function(e) {
    var that = this;
    wx.navigateTo({
      url: 'chooseCard?orderNo=' + orderNo + '&orderType=' + orderType + '&preCardCode=' + preCardCode
    });
  },

  //click to choose coupon
  chooseCoupon: function() {
    var that = this;
    wx.navigateTo({
      url: 'chooseCoupon?orderNo=' + orderNo + '&orderType=' + orderType + '&preVoucherCode=' + preVoucherCode
    });
  },

  //click to pay
  confirmToPay: function(e) {
    // console.log(e)
    var t = this,
      msg = t.data.msg,
      bindOrderPara = {
        'cinemaCode': cinemaCode,
        'memberCode': memberCode
      },
      flag = t.data.flag,
      flags = e.currentTarget.dataset.id,
      ticketName;
    // bindType = t.data.bindType;
    if (flags != '1') {
      if (t.data.cinemaStatus == '1' && flag == false) {
        t.setData({
          shade: true
        });
        return false;
      }
      wx.setStorageSync('flag', true)
    }

    if (t.data.dbClickFlag) {
      t.setData({
        dbClickFlag: false
      });
    } else {
      return false;
    }

    bindOrderPara.orderNo = orderNo;
    bindOrderPara.ticketDisPrice = msg.orderPrice - msg.favorPrice;
    bindOrderPara.preferentialNum = 0;
    bindOrderPara.prefAccount = ''; //卡或券的编号
    bindOrderPara.bindType = bindType; //绑定类型
    bindOrderPara.deductAmount = ''; //使用卡优惠需要扣除的次数或金额
    bindOrderPara.ticketSettPrice = ''; //Pos出票价
    bindOrderPara.version = '2.6';
    bindOrderPara.CVersion = wx.getStorageSync('CVersion');
    bindOrderPara.token = member.token;
    bindOrderPara.OS = wx.getStorageSync('OS');
    bindOrderPara.orderType = 1;

    if (favorInfo) {
      // bindOrderPara.prefAccount = favorInfo.preCardCode;
      if (bindType == '0') {
        bindOrderPara.prefAccount = favorInfo.preCardCode;
        bindOrderPara.cardType = precardType;
      } else if (bindType == '1') {
        bindOrderPara.prefAccount = favorInfo.preVoucherCode;
      } else {
        bindType = '-1';
      }
      bindOrderPara.bindType = bindType;
      bindOrderPara.preferentialNum = favorInfo.preferentialNum;
      bindOrderPara.deductAmount = favorInfo.deductAmount;
      bindOrderPara.ticketSettPrice = favorInfo.ticketSettPrice;
    }

    // console.log(bindOrderPara);
    wx.request({ //bindorder接口
      url: bindOrderUrl,
      method: 'GET',
      data: bindOrderPara,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        // console.log(res, bindOrderUrl);
        var data = res.data;
        // console.log(data);
        if (data.resultCode == 500) {
          wx.showModal({
            title: '提示',
            content: data.resultDesc,
            showCancel: false,
            success: function() {
              t.cancelOrder()
            }
          });
        }
        if (data.resultCode == 1) {
          t.setData({
            theFlag: true
          });
          if (data.resultDesc == 'TOKEN_INVALID') {
            logoutToken();
            t.setData({
              hideWin: false,
            });

          } else {
            if (data.resultDesc.indexOf("取消")) {
              wx.redirectTo({
                url: '../home/index',
              });
            }
          }
          return false;
        } else { /// bindorder 返回成功
          t.setData({
            theFlag: false
          });

          skipFlag = data.resultData.skipFlag;

          var exchangeParams = {
            'companyCode': movieCode,
            'cinemaCode': cinemaCode,
            'memberCode': memberCode,
            'token': token,
            'CVersion': CVersion,
            'OS': OS,
            'orderNo': orderNo,
            'payType': '5'
          };

          if (bindType == '1') {
            ticketName = t.data.preVoucherName;
          }
          if (skipFlag == '1' && bindType == '1') { // 此时选的是0元对换券，直接
            wx.showModal({
              title: '提示',
              content: '确认使用' + ticketName + '完成支付？',
              success: function(res) {
                if (res.confirm) { //// console.log('用户点击确定')
                  wx.request({ //调0元对换券支付接口
                    url: payExchange,
                    method: 'GET',
                    data: exchangeParams,
                    header: {
                      'Content-Type': 'text/plain',
                      'Accept': 'application/json'
                    },
                    success: function(res) {
                      // console.log(res)
                      if (res.data.resultCode == 0) {
												$showToast('支付成功')
                        t.paySuccess();
                      } else {
                        wx.showModal({
                          title: '提示',
                          content: res.data.resultDesc,
                          success: function(res) {
                            if (res.confirm) {
                              // console.log('用户点击确定')
                            } else if (res.cancel) {
                              // console.log('用户点击取消')
                            }
                          }
                        })
                        t.ajaxFn();
                      }
                    },
                    fail: function() {
                      t.ajaxFn();
                    },
                    complete: function() {}
                  });
                } else if (res.cancel) { //// console.log('用户点击取消')
                  t.setData({
                    dbClickFlag: true
                  });
                  t.ajaxFn();
                }
              }
            });
          } else {
            var params = {
              'cinemaCode': cinemaCode,
              'memberCode': memberCode
            };
            // console.log(userInfo)
            params.openId = member.openid;
            params.CVersion = wx.getStorageSync('CVersion');
            params.OS = wx.getStorageSync('OS');
            params.token = member.token;
            params.orderNo = orderNo;
            params.orderType = 1;
            params.payType = 1;
            // t.paySuccess();
            // url: 'https://api.mplus.net.cn:443/mplus/app/pay/initPay',
            if (bindType == '0' && precardType != '2') {
              t.setData({
                pswFlag: true
              });
            } else { //如果选的不是储值卡或者pos卡，则直接支付
              wx.request({
                url: initPay,
                method: 'GET',
                data: params,
                header: {
                  'Content-Type': 'text/plain',
                  'Accept': 'application/json'
                },
                success: function(res) {
                  var data = res.data,
                    url;
                  if (data.resultCode == 0) {
                    // 微信支付

                    // console.log(data);
                    wx.requestPayment({
                      'timeStamp': data.resultData.timeStamp,
                      'nonceStr': data.resultData.nonceStr,
                      'package': data.resultData.package,
                      'signType': data.resultData.signType,
                      'paySign': data.resultData.paySign,
                      'success': function(res) { //支付成功回调
                        // console.log(res);
                        t.paySuccess();
                      },
                      'fail': function(res) { //支付失败
                        t.setData({
                          dbClickFlag: true
                        });
                        t.ajaxFn();
                      },
                      'complete': function(res) { //支付完成
                        // console.log(res);
                      }
                    });
                  } else {

                    t.setData({
                      toastItem: {
                        text: data.resultDesc,
                        toast_visible: !0
                      }
                    });

                    setTimeout(function() {
                      t.setData({
                        toastItem: {
                          toast_visible: !1
                        }
                      });
                    }, 2000);
                  }
                },
              });
            }
          }
        }
      },
      fail: function() {},
      complete: function() {}
    });
  },

  //输入支付密码，点击确认按钮
  setPswFn: function(e) {
    var _this = this,
      formData = e.detail.value,
      psw = formData.setnewPsw,
      reg = /^\d{6}$/,
      payPosParams = {
        'companyCode': movieCode,
        'cinemaCode': cinemaCode,
        'memberCode': memberCode,
        'token': token,
        'CVersion': CVersion,
        'OS': OS,
        'password': '',
      };

    if (psw == '') {
			$showToast('请输入密码')
      return false;
    }
    if (precardType == '11') {
      checkCardPsw = checkPosCardPsw;
      payPosParams.prefAccount = preCardCode;
      payPosParams.orderNo = orderNo;
    } else {
      checkCardPsw = url.checkCardPsw;
    }
    payPosParams.password = psw;
    fn.buttonClicked(_this);
    // 补：防双击
    wx.request({
      url: checkCardPsw,
      method: 'GET',
      data: payPosParams,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        _this.checkWalletPswBack(res);
      },
      fail: function() {},
      complete: function() {}
    });

  },

  //校验卡密码后
  checkWalletPswBack: function(res) {
    var that = this,
      data = res.data;

    if (data.resultCode != "0") { //密码输入错误
      that.setData({
        psw: ''
      });

      wx.showModal({
        title: '提示',
        content: data.resultDesc,
      })
    } else {
      var payBackParams = {
        'companyCode': movieCode,
        'cinemaCode': cinemaCode,
        'memberCode': memberCode,
        'token': token,
        'CVersion': CVersion,
        'OS': OS,
        'orderNo': orderNo,
        'orderType': '1',
        'payType': ''
      };

      if (precardType == "10" || precardType == "11") {
        payBackParams.payType = precardType;
      } else {
        payBackParams.payType = 3; //小程序：3
      }
      wx.request({
        url: cardPayBack,
        method: 'GET',
        data: payBackParams,
        header: {
          'Content-Type': 'text/plain',
          'Accept': 'application/json'
        },
        success: function(res) {
          var data = res.data;
          if (data.resultCode != '0') {
						$showToast(data.resultDesc)
            that.ajaxFn();

            return false;
          } else {
            that.paySuccess();
          }
        },
        fail: function() {},
        complete: function() {}
      })
      that.setData({
        pswFlag: false,
        dbClickFlag: true
      });
    }

  },

  //取消订单
  cancleOrderFn: function(e) {
    var _this = this;
    wx.showModal({
      title: '提示',
      content: '是否取消订单',
      cancelText: '取消订单',
      confirmText: '确认支付',
      success: function(res) {
        if (res.confirm) { //用户点击确认支付
          _this.confirmToPay(e);
          clearInterval(_this.data.setTime);
          // console.log(_this.data.setTime, _this.data.downFlag)
        } else if (res.cancel) { //用户点击取消订单
          _this.cancelOrder();
          _this.setData({
            downFlag: 2
          })
          clearInterval(_this.data.setTime);
        }
      }
    })
  },

  //account details
  accountDetails: function(e) {
    var that = this,
      animation = wx.createAnimation({
        //动画持续时间
        duration: 500,
        //定义动画效果，当前是匀速
        timingFunction: 'ease',
        delay: 0, //动画延迟时间，单位 ms
        transformOrigin: "50% 100% 0"
      });
    // 将该变量赋值给当前动画
    that.animation = animation;
    animation.translateY(380).step();

    that.setData({
      animationData: animation.export(),
      detailsflag: true
    });

    setTimeout(function() {
      animation.translateY(0).step();
      that.setData({
        animationData: animation.export()
      });
    }.bind(this), 200);
  },

  //hide the detail window
  hideDetails: function() {
    var that = this,
      animation1 = wx.createAnimation({
        //动画持续时间
        duration: 500,
        //定义动画效果，当前是匀速
        timingFunction: 'ease',
        delay: 0, //动画延迟时间，单位 ms
        transformOrigin: "50% 100% 0"
      });

    that.animation = animation1;
    animation1.translateY(380).step();

    that.setData({
      animationData: animation1.export()
    });

    setTimeout(function() {
      animation1.translateY(0).step();
      that.setData({
        animationData: animation1.export(),
        detailsflag: false,
        shade1: false
      });
    }.bind(this), 300);
  },

  //支付成功之后
  paySuccess: function(e) {
    var that = this,
      orderInfoParams = {
        'cinemaCode': cinemaCode,
        'memberCode': memberCode,
        'orderNo': orderNo,
        'randomTime': new Date().getTime(),
        'token': member.token
      };
    that.setData({
      downFlag: 2
    })
    wx.request({
      url: URL,
      method: 'GET',
      data: orderInfoParams,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        var data = res.data,
          url = '',
          movieCode = wx.getStorageSync('movieCode'),
          failFlag = true;
        that.setData({
          downFlag: 2
        })
        clearInterval(that.setTime);

        if (data.resultCode == 0) {
          if (data.resultData.orderState == '1001') { //支付成功
            url = '../payResult/paySuc?orderNo=' + orderNo + '&companyCode=' + movieCode;
          } else if (data.resultData.orderState == '1002') { //出票失败
            url = '../payResult/payFail?orderNo=' + orderNo + '&companyCode=' + movieCode + '&failFlag=' + failFlag;
          } else if (data.resultData.orderState == '1007' || data.resultData.orderState == '1000') { //出票中
            failFlag = false;
            url = '../payResult/checking?orderNo=' + orderNo + '&companyCode=' + movieCode + '&failFlag=' + failFlag;
          }
          wx.redirectTo({
            url: url,
          });
        }
      }
    })
  },

  //pop window confirm fn
  confirm: function() {
    var thus = this,
      url = path + "";

    thus.setData({
      hideWin: true
    });

    if (thus.data.theFlag) {
      var data = {
        orderNo: orderNo,
        cinemaCode: cinemaCode,
        memberCode: memberCode
      };
      wx.request({
        url: cancelOrderUrl,
        method: 'GET',
        data: data,
        header: {
          'Content-Type': 'text/plain',
          'Accept': 'application/json'
        },
        success: function(res) {
          wx.redirectTo({
            url: '../login/login',
          });
          clearInterval(setTime);
        }
      });
    }

  },

  confirm1: function() {
    var that = this,
      url = '../home/index';
    var data = {
      orderNo: orderNo,
      cinemaCode: cinemaCode,
      memberCode: memberCode
    };
    wx.request({
      url: cancelOrderUrl,
      method: 'GET',
      data: data,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        if (res.data.resultCode == 1) {
					$showToast(res.data.resultDesc)
        } else {
          wx.switchTab({
            url: url,
          });
        }
      }
    });
    // wx.switchTab({
    //     url: url,
    // });

  },
  cancelOrder: function() {
    var data = {
      orderNo: orderNo,
      cinemaCode: cinemaCode,
      memberCode: memberCode
    };
    wx.request({
      url: cancelOrderUrl,
      method: 'GET',
      data: data,
      header: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      success: function(res) {
        // console.log(res);
        if (res.data.resultCode == 1) {
					$showToast(res.data.resultDesc)
        } else {
          wx.switchTab({
            url: '../home/index'
          })
        }
      }
    });
  },
  //剩余支付时间，倒计时
  countDownFn: function(time) {
    //  // console.log(time);
    var t1 = time.substring(0, time.length - 1).split('分'),
      minute = t1[0],
      second = t1[1];

    var that = this,
      // data = that.data.msg,
      orderTimeOut;


    var setTime = setInterval(function() {
      second--;
      if (second == -1) {
        minute--;

        if (minute == -1) {
          clearInterval(setTime);
          minute = 0;
          second = 0;
        } else {
          second = 59;
        }
      }
      if (minute == 0 && second == 0) {
        // console.log(minute, second)
        // leftTime = "00:00";
        clearInterval(setTime);
        that.cancelOrder();
        if (that.data.downFlag === 1) {
          that.setData({
            downFlag: 2
          });
          that.cancelOrder();
        }
        that.setData({
          downFlag: true
        });

        return false;
      }
      orderTimeOut = minute + '分' + second + '秒';
      // $("#countDown").text(minute + '分' + second + '秒');
      that.setData({
        orderTimeOut
      });

    }, 1000);
    that.setData({
      setTime
    })
  },

  // 打开退款说明
  explain: function() {
    this.setData({
      shade: true
    });
  },
  explain2: function() {
    this.setData({
      flag: !this.data.flag
    })
  },
  // 同意退款说明
  explains: function() {
    this.setData({
      shade: false,
    })
  },

  // 不可退
  explain1: function() {
    var t = this;
    t.setData({
      shade1: true,
    });
    wx.showModal({
      title: '',
      content: '本影院不支持退票',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#f6553c',
      success: function() {
        t.setData({
          shade1: false,
        });
      }
    })
  },

  makephone: function(e) {
    // console.log(e)
    wx.makePhoneCall({
      phoneNumber: this.data.theaterPhone,
    })
  },

  //关闭输入密码弹框
  hideDetailsFn: function() {
    var that = this;

    that.setData({
      pswFlag: false,
      dbClickFlag: true,
    });

    that.ajaxFn();
  }
})