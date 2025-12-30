import accounttitleincome from '../../models/AccountTitleIncome/accounttitleincome.js';
import accountNumberincome from '../../models/AccountNumberIncome/accountNumberincome.js'


// Creating a new account
export const createAccountTitleIncome = async (req, res) => {
  try {
    const { AccountTitleIncome } = req.body;
    if (!AccountTitleIncome) {
      return res.status(400).json({ message: 'Account Title is required' });
    }

    const existingAccountTitleIncome = await accounttitleincome.findOne({ AccountTitleIncome }); // fix: use object
        
    if (existingAccountTitleIncome) {
      return res.status(409).json({ message: 'AccountTitleIncome already exists' }); // return early
    }

    const newAccount = new accounttitleincome({ AccountTitleIncome });
    const savedAccount = await newAccount.save();
    res.status(201).json({ message: 'Account Title created successfully', accounttitleincome: savedAccount });
  } catch (error) {
    console.error('Error creating Account Title:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetching all accounts
export const getallaccountTitleincome = async (req, res) => {
  try {
    const getaccount = await accounttitleincome.find({});
    return res.status(200).send({
      success: true,
      message: "Get all accounts",
      getaccount,
    });
  } catch (error) {
    console.error('Error fetching all accounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Creating a new account
export const createAccountNumberIncome = async (req, res) => {
  try {
    const { AccountIncomeNumber } = req.body;
    if (!AccountIncomeNumber) {
      return res.status(400).json({ message: 'Account Number Income is required' });
    }

            const existingaccountincomenumber = await accountNumberincome.findOne({ AccountIncomeNumber }); // fix: use object
        
            if (existingaccountincomenumber) {
              return res.status(409).json({ message: 'AccountIncomeNumber already exists' }); // return early
            }

    const newAccount = new accountNumberincome({ AccountIncomeNumber });
    const savedAccount = await newAccount.save();
    res.status(201).json({ message: 'Account Number created successfully', accountNumberincome: savedAccount });
  } catch (error) {
    console.error('Error creating Account Number:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Fetching all accounts
export const getallaccountNumberincome = async (req, res) => {
  try {
    const getnumber = await accountNumberincome.find({});
    return res.status(200).send({
      success: true,
      message: "Get all accounts number Income",
      getnumber,
    });
  } catch (error) {
    console.error('Error fetching all Number Income:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

