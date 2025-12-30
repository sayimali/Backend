import expanseaccountnumber from '../../models/ExpanseNum/expanseaccountnumber.js';
import accountExpans from '../../models/Accountexpanse/accountExpanseTitle.js';


// Creating a new account
export const createAccountExpanse = async (req, res) => {
  try {
    const { Account } = req.body;
    if (!Account) {
      return res.status(400).json({ message: 'Account name is required' });
    }

    const newAccount = new accountExpans({ Account });
    const savedAccount = await newAccount.save();
    res.status(201).json({ message: 'Account created successfully', Account: savedAccount });
  } catch (error) {
    console.error('Error creating Account:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetching all accounts
export const getallaccountexpanse = async (req, res) => {
  try {
    const getaccount = await accountExpans.find({});
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
export const createNumberExpanse = async (req, res) => {
  try {
    const { ExpanseNumber } = req.body;
    if (!ExpanseNumber) {
      return res.status(400).json({ message: 'Numbersss is required' });
    }

    const newNumber = new expanseaccountnumber({ ExpanseNumber });
    const savedNumber = await newNumber.save();
    res.status(201).json({ message: 'Account created successfully', ExpanseNumber: savedNumber });
  } catch (error) {
    console.error('Error creating Account Number:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Fetching all accounts
export const getallNumberexpanse = async (req, res) => {
  try {
    const getnumber = await expanseaccountnumber.find({});
    return res.status(200).send({
      success: true,
      message: "Get all accounts number",
      getnumber,
    });
  } catch (error) {
    console.error('Error fetching all Number:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
