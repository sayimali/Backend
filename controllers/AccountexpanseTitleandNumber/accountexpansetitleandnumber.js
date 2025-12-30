import accountExpanseTitle from '../../models/Accountexpanse/accountExpanseTitle.js';
import accountExpanseNumber from '../../models/AccountexpanseNumber/accountExpanseNumber.js';

// Creating a new account
export const createAccountExpanseTitle = async (req, res) => {
	try {
		const { AccountExpanseTitle } = req.body;
		if (!AccountExpanseTitle) {
			return res.status(400).json({ message: 'Account Title is required' });
		}

			 const existingAccountExpanseTitle = await accountExpanseTitle.findOne({ AccountExpanseTitle }); // fix: use object
				  
			 if (existingAccountExpanseTitle) {
				return res.status(409).json({ message: 'AccountExpanseTitle already exists' }); // return early
			 }

		const newAccount = new accountExpanseTitle({ AccountExpanseTitle });
		const savedAccount = await newAccount.save();
		res.status(201).json({ message: 'Account Title expanse created successfully', accountExpanseTitle: savedAccount });
	} catch (error) {
		console.error('Error creating Account Title Expanse:', error);
		res.status(500).json({ message: 'Server error' });
	}
};

// Fetching all accounts
export const getallaccountexpanseTitle = async (req, res) => {
	try {
		const getaccount = await accountExpanseTitle.find({});
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
export const createNumberExpanseNumber = async (req, res) => {
	try {
		const { AccountExpanseNumber } = req.body;
		if (!AccountExpanseNumber) {
			return res.status(400).json({ message: 'Account Number Expanse is required' });
		}

		const newAccount = new accountExpanseNumber({ AccountExpanseNumber });
		const savedAccount = await newAccount.save();
		res.status(201).json({ message: 'Account Number created successfully', accountExpanseNumber: savedAccount });
	} catch (error) {
		console.error('Error creating Account Number:', error);
		res.status(500).json({ message: 'Server error' });
	}
};


// Fetching all accounts
export const getallNumberexpanseNumber = async (req, res) => {
	try {
		const getnumber = await accountExpanseNumber.find({});
		return res.status(200).send({
			success: true,
			message: "Get all accounts number Expanse",
			getnumber,
		});
	} catch (error) {
		console.error('Error fetching all Number Expanse:', error);
		res.status(500).json({ message: 'Server error' });
	}
};

