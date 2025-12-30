import device from '../../models/Device/device.js';
import city from '../../models/City/city.js';
import packagess from '../../models/Packagess/packagess.js';


export const createDeviceIncome = async (req, res) => {
  try {
    const { Device } = req.body;

    if (!Device) {
      return res.status(400).json({ message: 'Device name is required' });
    }
    const existingDevice = await city.findOne({ Device }); // fix: use object

    if (existingDevice) {
      return res.status(409).json({ message: 'Device already exists' }); // return early
    }

    const newDevice = new device({ Device }); // Use "Device" model
    const savedDevice = await newDevice.save();

    res.status(201).json({ message: 'Device created successfully', Device: savedDevice });
  } catch (error) {
    console.error('Error creating Device:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getalldevice = async (req, res) => {
  try {
    const getdevice = await device.find({});
    return res.status(200).send({
      success: true,
      message: "Get all devices",
      getdevice,
    });
  } catch (error) {
    console.error('Error fetching all devices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCityIncome = async (req, res) => {
  try {
    const { City } = req.body;

    if (!City) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const existingCity = await city.findOne({ City }); // fix: use object

    if (existingCity) {
      return res.status(409).json({ message: 'City already exists' }); // return early
    }

    const newCity = new city({ City });
    const savedCity = await newCity.save();

    res.status(201).json({ message: 'City created successfully', City: savedCity });
  } catch (error) {
    console.error('Error creating City:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getallcity = async (req, res) => {
  try {
    const getcity = await city.find({});
    return res.status(200).send({
      success: true,
      message: "Get all cities",
      getcity,
    });
  } catch (error) {
    console.error('Error fetching all cities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPackageIncome = async (req, res) => {
  try {
    const { Package} = req.body;

    const newPackage = new packagess({ Package }); // Use "Package" model
    const savedPackage = await newPackage.save();

    res.status(201).json({ message: 'Package created successfully', Package: savedPackage });
  } catch (error) {
    console.error('Error creating Package:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getallpackage = async (req, res) => {
  try {
    const getpackage = await packagess.find({}); // Use "Package" model
    return res.status(200).send({
      success: true,
      message: "Get all packages",
      getpackage,
    });
  } catch (error) {
    console.error('Error fetching all packages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


