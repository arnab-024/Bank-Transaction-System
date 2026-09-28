const transactionModel = require("../models/transaction.model.js");
const ledgerModel = require("../models/ledger.model.js");
const emailService = require("../services/email.service.js");
const accountModel = require("../models/account.model.js");
const userModel = require("../models/user.model.js");
const mongoose = require("mongoose");

/**
 ** - Create a new transaction
 * The 10 step transfter flow:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create Debit ledger entry for sender
 * 7. create Credit ledger entry for receiver
 * 8. Mark transaction as COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransaction(req, res) {
  //1. VALIDATE REQUEST
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "All fields are required!",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount) {
    return res.status(404).json({
      message: "User/Sender Account is invalid",
    });
  }
  if (!toUserAccount) {
    return res.status(404).json({
      message: "Receiver Account is invalid",
    });
  }
  //2. VALIDATE IDEMPOTENCY KEY
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "completed") {
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: isTransactionAlreadyExists,
      });
    } else if (isTransactionAlreadyExists.status === "pending") {
      return res.status(200).json({
        message: "Transaction is still pending",
      });
    } else if (isTransactionAlreadyExists.status === "failed") {
      return res.status(500).json({
        message: "Transaction has failed! Please try again.",
        transaction: isTransactionAlreadyExists,
      });
    } else {
      return res.status(500).json({
        message: "Transaction has reversed! Please try again.",
        transaction: isTransactionAlreadyExists,
      });
    }
  }

  //3. CHECK ACCOUNT STATUS
  if (
    fromUserAccount.status !== "active" ||
    toUserAccount.status !== "active"
  ) {
    return res.status(400).json({
      message: "Both accounts must be active to perform a transaction",
    });
  }

  //4. DERIVE SENDER BALANCE
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance to perform this transaction. Your current balance is ${balance}
     and the requested is ${amount}`,
    });
  }

  let transaction;

  try {
    //5. CREATE TRANSACTION (PENDING)
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "pending",
          },
        ],
        { session }
      )
    )[0];

    //6. DEBIT LEDGER ENTRY
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "debit",
        },
      ],
      { session }
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    })();

    //7. CREDIT LEDGER ENTRY
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "credit",
        },
      ],
      { session }
    );

    //8. TRANSACTION COMPLETED
    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "completed" },
      { session }
    );

    //9. SESSION END
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message:
        "Transaction is pending due to some issues, please retry after sometime",
      error: error.message,
    });
  }

  //10. SEND EMAIL NOTIFICATION
  const sender = await userModel.findById(fromUserAccount.user);
  await emailService.sendTransactionEmail(
    sender.email,
    sender.name,
    amount,
    toUserAccount._id.toString(),
  );
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotency key are required!",
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(404).json({
      message: "Receiver account not found!",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "pending",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      //when creating a session, data must be passed as an array
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "debit",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "credit",
      },
    ],
    { session },
  );

  transaction.status = "completed";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction,
  });
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};
