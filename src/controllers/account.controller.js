const accountModel = require("../models/account.model.js");

async function createAccountController(req, res) {
  const user = req.user;

  const isAccountExists = await accountModel.findOne({
    user: user._id,
  });

  if (isAccountExists) {
    return res.status(409).json({
      message: "An account for this user already exists",
      status: "Failed",
    });
  }

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    account: {
      _id: account._id,
      user: account.user,
      status: account.status,
    },
  });
}

async function getUserAccountsController(req, res) {
  const accounts = await accountModel.find({ user: req.user._id });
  res.status(200).json({
    accounts,
  });
}

async function getAccountBalanceController(req, res) {
  const { accountId } = req.params;
  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if(!account) {
    return res.status(404).json({
        message: "Account not found"
    });
  }
  const balance = await account.getBalance();
  res.status(200).json({
    accountId: account._id,
    balance: balance 
  });
}

module.exports = { createAccountController, getUserAccountsController, getAccountBalanceController };
